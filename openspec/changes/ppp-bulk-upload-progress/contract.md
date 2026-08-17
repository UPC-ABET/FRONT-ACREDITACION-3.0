# Contract — PPP bulk upload progress

Backend: UPC-ABET/BACK-ACREDITACION-3.0#104. Both endpoints are period-scoped through the
`X-Academic-Period-Id` header — **no `academicPeriodId` in the request body**. (An earlier
frontend revision passed one; it was never read, and it has been dropped.)

## `POST ppp/survey/upload-excel`

Starts the import and returns immediately.

**Request**

| Field        | Type     | Notes                                    |
| ------------ | -------- | ---------------------------------------- |
| `fileBase64` | `string` | The workbook, base64, no data-URI prefix |
| `programId`  | `number` | Required; `0` is not a valid program     |
| `campusId`   | `number` | `0` means "not filtered by campus"       |

**Response** (`data`)

| Field       | Type      | Notes                                                     |
| ----------- | --------- | --------------------------------------------------------- |
| `accepted`  | `boolean` | `false` means the job was **not** queued — do not poll    |
| `jobId`     | `string`  | Opaque; the frontend URL-encodes it when polling          |
| `totalRows` | `number`  | Data rows detected, used to seed the dialog before poll 1 |

The frontend treats `accepted === false` **or** an empty `jobId` as a failed start and
surfaces `error.survey.ppp.uploadJobNotFound` rather than starting a poll that can never
advance.

## `GET ppp/survey/upload-status/:jobId`

**Response** (`data`)

| Field           | Type                   | Notes                                                                     |
| --------------- | ---------------------- | ------------------------------------------------------------------------- |
| `progressPct`   | `number`               | 0–100, monotonic                                                          |
| `totalRows`     | `number`               |                                                                           |
| `processedRows` | `number`               |                                                                           |
| `done`          | `boolean`              | Terminal signal — the frontend polls on this, not on `progressPct >= 100` |
| `result`        | `UploadResult \| null` | Non-null only once `done` is `true`                                       |

### `UploadResult`

| Field             | Type                                              | Notes                                                                                                                     |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `total`           | `number`                                          |                                                                                                                           |
| `success`         | `number`                                          | `0` whenever `failed > 0` — the import is all-or-nothing                                                                  |
| `failed`          | `number`                                          |                                                                                                                           |
| `errors`          | `Array<string \| { row, code, reason, message }>` | PPP returns plain `"Row N: message"` strings; other upload endpoints return objects. The frontend adapter accepts either. |
| `excelWithErrors` | `string \| null`                                  | Base64 xlsx: the submitted workbook plus an "Errores" column. Present only when `failed > 0`.                             |
| `fileName`        | `string \| null`                                  | Suggested download name for `excelWithErrors`                                                                             |

## Polling contract

- Interval: 1s while running.
- The client stops polling on `done === true`, on any error response, or after 10 minutes.
- Job state is held in-process on the backend, so a status call may 404 after a restart or
  when it lands on a different replica. The client surfaces this as a failed upload; making
  jobs durable is out of scope for this change (see [proposal.md](./proposal.md)).
