import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { PortfolioFileItem } from '@/modules/Portfolio/types'

export const BUCKET_NAME = process.env.NEXT_AWS_BUCKET_NAME ?? ''
const BUCKET_REGION = process.env.NEXT_AWS_BUCKET_REGION ?? ''
const ACCESS_KEY_ID = process.env.NEXT_AWS_PUBLIC_KEY ?? ''
const SECRET_ACCESS_KEY = process.env.NEXT_AWS_SECRET_KEY ?? ''

const UNIQUE_TAG = '+UPC@2020/*1148I'

const ActionType = {
  update: 'UPDATE',
  copy: 'COPY',
  delete: 'DELETE',
  rename: 'RENAME',
  move: 'MOVE',
} as const

type ActionTypeKey = (typeof ActionType)[keyof typeof ActionType]

interface ActionItem {
  name: string
  key: string
}

interface InternalResult {
  success: boolean
  result?: unknown
  error?: unknown
}

let _client: S3Client | null = null

export function getS3Client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: BUCKET_REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  })
  return _client
}

export async function s3ListDirectory(directory: string): Promise<PortfolioFileItem[]> {
  const command = new ListObjectsCommand({
    Bucket: BUCKET_NAME,
    Delimiter: '/',
    Prefix: directory ?? '',
  })

  const result = await getS3Client().send(command)
  const data: PortfolioFileItem[] = []
  let i = 0

  if (result.CommonPrefixes) {
    for (const value of result.CommonPrefixes) {
      i++
      const elements = (value.Prefix ?? '').split('/')
      const name = elements[elements.length - 2] ?? ''
      data.push({
        id: i,
        name,
        esDirectorio: true,
        key: value.Prefix ?? '',
        ultimaModificacion: '-',
        active: false,
      })
    }
  }

  if (result.Contents) {
    for (const value of result.Contents) {
      i++
      const elements = (value.Key ?? '').split('/')
      const name = elements[elements.length - 1] ?? ''
      data.push({
        id: i,
        name,
        esDirectorio: false,
        key: value.Key ?? '',
        ultimaModificacion: value.LastModified,
        tamano: value.Size,
        tag: value.ETag,
        active: false,
      })
    }
  }

  return data
}

export async function s3GetPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  return getSignedUrl(getS3Client(), command, { expiresIn })
}

export async function s3GetFolderKeys(
  prefix: string
): Promise<{ Key: string; Size: number }[]> {
  const client = getS3Client()
  let ContinuationToken: string | undefined
  let isTruncated = true
  const allFiles: { Key: string; Size: number }[] = []

  while (isTruncated) {
    const request = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken,
      })
    )
    const filtered = (request.Contents ?? []).filter(
      (obj) => obj.Key && !obj.Key.endsWith('/')
    )
    allFiles.push(...filtered.map((f) => ({ Key: f.Key as string, Size: f.Size ?? 0 })))
    isTruncated = request.IsTruncated ?? false
    ContinuationToken = request.NextContinuationToken
  }

  return allFiles
}

export async function s3GetSizeFolder(
  directory: string
): Promise<{ size: number; modified: Date | null }> {
  const command = new ListObjectsCommand({
    Bucket: BUCKET_NAME,
    Delimiter: '/',
    Prefix: directory ?? '',
  })

  const result = await getS3Client().send(command)
  let folderSize = 0
  let latestModified: Date | null = null

  if (result.Contents) {
    for (const file of result.Contents) {
      folderSize += file.Size ?? 0
      if (file.LastModified) {
        const fileModified = new Date(file.LastModified)
        if (!latestModified || fileModified > latestModified) {
          latestModified = fileModified
        }
      }
    }
  }

  if (result.CommonPrefixes) {
    for (const prefix of result.CommonPrefixes) {
      const { size: subSize, modified: subModified } = await s3GetSizeFolder(
        prefix.Prefix ?? ''
      )
      folderSize += subSize
      if (subModified && (!latestModified || subModified > latestModified)) {
        latestModified = subModified
      }
    }
  }

  return { size: folderSize, modified: latestModified }
}

export async function s3CreateEmptyFolder(folderPath: string): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({ Bucket: BUCKET_NAME, Key: folderPath, Body: '' })
  )
}

async function folderExists(folderName: string, rutaFolder: string): Promise<boolean> {
  const nuevaRuta = rutaFolder !== '' ? rutaFolder + '/' + folderName : folderName
  const response = await getS3Client().send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: nuevaRuta,
      Delimiter: '/',
    })
  )
  return !!response.CommonPrefixes && response.CommonPrefixes.length > 0
}

async function getUniqueFolderName(folderName: string, rutaFolder: string): Promise<string> {
  let uniqueName = folderName
  let suffix = 1
  while (await folderExists(uniqueName, rutaFolder)) {
    uniqueName = `${folderName} (${suffix})`
    suffix++
  }
  return uniqueName
}

export async function s3CreateFolder(
  folderName: string,
  rutaFolder: string
): Promise<string> {
  const uniqueName = await getUniqueFolderName(folderName, rutaFolder)
  const nuevaRuta = rutaFolder !== '' ? `${rutaFolder}/${uniqueName}` : uniqueName

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${nuevaRuta}/`,
      Body: '',
      ContentType: 'application/x-directory',
    })
  )

  return uniqueName
}

export async function s3CreateTextFile(
  fileName: string,
  rutaFolder: string
): Promise<void> {
  const fullPath = rutaFolder ? `${rutaFolder}/${fileName}` : fileName
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullPath,
      Body: '',
      ContentType: 'text/plain',
    })
  )
}

function esDirectorioKey(dir: string): boolean {
  return dir[dir.length - 1] === '/'
}

function withoutPattern(chain: string): string {
  return chain.replace(/\(\d+\)/, '').trim()
}

function normalizeNewName(key: string, name: string): string {
  let suffix = ''
  if (key[key.length - 1] === '/') {
    suffix = '/'
  } else {
    const extension = key.split('.')
    if (extension.length === 1) return name
    suffix = '.' + extension[extension.length - 1]
  }
  return name + suffix
}

async function actionTypeDocument(
  stacks: ActionItem[] = [],
  dir = '',
  action: ActionTypeKey
): Promise<boolean> {
  const tempPromises: Promise<InternalResult>[] = []
  const client = getS3Client()
  const workStack = [...stacks]

  while (workStack.length !== 0) {
    const stack = workStack.pop()!
    let { name } = stack
    const { key } = stack
    const isFolder = esDirectorioKey(key)

    name = normalizeNewName(key, name)
    const directory = key.split('/')
    let dirName: string

    if (directory[directory.length - 1] === '') {
      dirName = directory[directory.length - 2]
      dirName = key.replace(dirName + '/', '')
    } else {
      dirName = directory[directory.length - 1]
      dirName = key.replace(dirName, '')
    }

    if (isFolder) {
      const listCmd = new ListObjectsCommand({ Bucket: BUCKET_NAME, Prefix: key })
      const result = await client.send(listCmd)
      const folderName = name
      const splitKey = key.split('/')
      let sliceJoin = key
      if (splitKey.length > 3) {
        sliceJoin = splitKey.slice(0, -2).join('/') + '/'
      }

      if (result.Contents) {
        let path = ''
        for (const x of result.Contents) {
          let vkey = x.Key ?? ''
          const folderNameNormal = withoutPattern(folderName)
          let nname = ''

          if (action === ActionType.rename) {
            nname = dirName + vkey.replace(key, name).replace(UNIQUE_TAG, '')
          } else if (action === ActionType.copy || action === ActionType.move) {
            if (splitKey.length > 3) {
              vkey = vkey.replace(sliceJoin, '')
            }
            const index = vkey.lastIndexOf(folderNameNormal)
            if (index !== -1) {
              path = dir + vkey.substring(index).replace(folderNameNormal, folderName)
            } else {
              const nindex = vkey.lastIndexOf(folderName)
              if (nindex !== -1) path = dir + vkey.substring(nindex)
            }
          }

          if (
            action === ActionType.copy ||
            action === ActionType.rename ||
            action === ActionType.move
          ) {
            const commandCopy = new CopyObjectCommand({
              Bucket: BUCKET_NAME,
              CopySource: `/${BUCKET_NAME}/${encodeURIComponent(x.Key ?? '')}`,
              Key:
                action === ActionType.copy
                  ? path
                  : action === ActionType.rename
                    ? nname
                    : path,
            })
            tempPromises.push(
              client
                .send(commandCopy)
                .then((res) => ({ success: true, result: res }) as InternalResult)
                .catch((err) => ({ success: false, error: err }) as InternalResult)
            )
          }

          if (
            action === ActionType.delete ||
            action === ActionType.rename ||
            action === ActionType.move
          ) {
            const commandDelete = new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: x.Key ?? '',
            })
            tempPromises.push(
              client
                .send(commandDelete)
                .then((res) => ({ success: true, result: res }) as InternalResult)
                .catch((err) => ({ success: false, error: err }) as InternalResult)
            )
          }
        }
      }
    } else {
      let nname = ''
      if (action === ActionType.rename) nname = dirName + name
      else if (action === ActionType.copy || action === ActionType.move)
        nname = dir + stack.name

      if (
        action === ActionType.copy ||
        action === ActionType.rename ||
        action === ActionType.move
      ) {
        const commandCopy = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `/${BUCKET_NAME}/${encodeURIComponent(key)}`,
          Key: nname,
        })
        tempPromises.push(
          client
            .send(commandCopy)
            .then((res) => ({ success: true, result: res }) as InternalResult)
            .catch((err) => ({ success: false, error: err }) as InternalResult)
        )
      }

      if (
        action === ActionType.delete ||
        action === ActionType.rename ||
        action === ActionType.move
      ) {
        const commandDelete = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
        tempPromises.push(
          client
            .send(commandDelete)
            .then((res) => ({ success: true, result: res }) as InternalResult)
            .catch((err) => ({ success: false, error: err }) as InternalResult)
        )
      }
    }
  }

  const results = await Promise.all(tempPromises)
  return results.every((r) => r.success)
}

async function deleteObject(key: string): Promise<InternalResult> {
  try {
    const response = await getS3Client().send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    )
    return { success: true, result: response }
  } catch (error) {
    return { success: false, error }
  }
}

async function deleteMultipleObjects(keys: string[]): Promise<InternalResult> {
  try {
    const batchSize = 1000
    let allDeleted = true
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const response = await getS3Client().send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: batch.map((k) => ({ Key: k })),
            Quiet: true,
          },
        })
      )
      if (response.$metadata.httpStatusCode !== 200) allDeleted = false
    }
    return { success: allDeleted }
  } catch (error) {
    return { success: false, error }
  }
}

async function obtenerKeysDeCarpeta(keyCarpeta: string): Promise<string[]> {
  let keys: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: keyCarpeta.endsWith('/') ? keyCarpeta : keyCarpeta + '/',
        ContinuationToken: continuationToken,
      })
    )
    const batchKeys = response.Contents
      ? response.Contents.map((obj) => obj.Key ?? '')
      : []
    keys = keys.concat(batchKeys.filter((k) => k && k !== keyCarpeta))
    continuationToken = response.NextContinuationToken
  } while (continuationToken)
  return keys
}

async function actionDeleteDocument(
  stacks: ActionItem[] = [],
  dir = '',
  action: ActionTypeKey = ActionType.delete
): Promise<boolean> {
  const tempPromises: Promise<InternalResult>[] = []

  for (const stack of stacks) {
    const { key } = stack
    if (esDirectorioKey(key)) {
      const keysToDelete = await obtenerKeysDeCarpeta(key)
      if (keysToDelete.length > 0 && action === ActionType.delete) {
        tempPromises.push(deleteMultipleObjects(keysToDelete))
        tempPromises.push(deleteObject(key))
      }
      if (keysToDelete.length === 0 && action === ActionType.delete) {
        tempPromises.push(deleteObject(key))
      }
    } else if (action === ActionType.delete) {
      tempPromises.push(deleteMultipleObjects([key]))
    }
  }

  const results = await Promise.all(tempPromises)
  let allResolved = results.every((r) => r.success)

  if (action === ActionType.delete && dir && esDirectorioKey(dir)) {
    const deleteDirResult = await deleteObject(dir)
    allResolved = allResolved && deleteDirResult.success
  }

  return allResolved
}

export async function s3Rename(key: string, name: string): Promise<boolean> {
  return actionTypeDocument([{ name, key }], '', ActionType.rename)
}

export async function s3Delete(stack: ActionItem[]): Promise<boolean> {
  return actionDeleteDocument(stack, '', ActionType.delete)
}

export async function s3Copy(stack: ActionItem[], dir: string): Promise<boolean> {
  return actionTypeDocument(stack, dir, ActionType.copy)
}

export async function s3Move(stack: ActionItem[], dir: string): Promise<boolean> {
  return actionTypeDocument(stack, dir, ActionType.move)
}

export async function s3Upload(key: string, body: Buffer | Uint8Array): Promise<void> {
  const parallelUploads3 = new Upload({
    client: getS3Client(),
    params: { Bucket: BUCKET_NAME, Key: key, Body: body },
    tags: [],
    queueSize: 8,
    partSize: 500 * 1024 * 1024,
    leavePartsOnError: false,
  })
  await parallelUploads3.done()
}

export async function s3ListAllKeys(): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      })
    )
    response.Contents?.forEach((obj) => {
      if (obj.Key) keys.push(obj.Key)
    })
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)
  return keys
}
