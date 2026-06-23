'use client';

import { useCallback, useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    LazySelect,
    type LazySelectValue,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { courseSectionsService, enrolledStudentsService } from '@/modules/academic';
import type {
    CourseSectionMaintenanceItem,
    EnrolledStudentMaintenanceItem,
    AssignRepresentativeDto,
} from '@/modules/academic';

const PAGE_SIZE = 20;

type Props = {
    saving: boolean;
    errorMessage: string | null;
    onClose: () => void;
    onSave: (body: AssignRepresentativeDto) => void;
};

function sectionLabel(section: CourseSectionMaintenanceItem): string {
    return `${section.courseCode} — ${section.sectionCode}`;
}

function studentLabel(student: EnrolledStudentMaintenanceItem): string {
    return `${student.studentCode} — ${student.firstName} ${student.lastName}`;
}

export function ClassRepresentativeCreateDialog({
    saving,
    errorMessage,
    onClose,
    onSave,
}: Props) {
    const { t } = useI18n();

    // Guardamos los objetos de sección y estudiante seleccionados
    const [section, setSection] = useState<LazySelectValue | null>(null);
    const [student, setStudent] = useState<LazySelectValue | null>(null);

    // Guardamos los códigos reales para enviarlos al backend en el submit
    const [codes, setCodes] = useState<{ studentCode: string; sectionCode: string } | null>(null);

    const loadSections = useCallback(
        ({ search, page }: { search: string; page: number }) =>
            courseSectionsService
                .maintenanceList({ search, page, pageSize: PAGE_SIZE })
                .then((response) => ({
                    items: response.data.items,
                    totalPages: response.data.totalPages,
                })),
        [],
    );

    const loadStudents = useCallback(
        ({ search, page }: { search: string; page: number }) =>
            enrolledStudentsService
                .maintenanceList({ search, page, pageSize: PAGE_SIZE })
                .then((response) => ({
                    items: response.data.items,
                    totalPages: response.data.totalPages,
                })),
        [],
    );

    const canSave = section != null && student != null && !saving;

    const handleSubmit = () => {
        if (!codes?.sectionCode || !codes?.studentCode) return;
        onSave({
            sectionCode: codes.sectionCode,
            studentCode: codes.studentCode,
        });
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !saving) onClose();
            }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('Nuevo Delegado')}</DialogTitle>
                    <DialogDescription>
                        {t('Seleccione la sección y el estudiante correspondiente para asignarle el cargo.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <LazySelect<CourseSectionMaintenanceItem>
                        label={t('Sección')}
                        placeholder={t('Seleccione sección...')}
                        value={section}
                        onChange={(sectionItem) => {
                            setSection(
                                sectionItem ? { id: sectionItem.id, label: sectionLabel(sectionItem) } : null,
                            );
                            setCodes((prev) => ({
                                studentCode: prev?.studentCode || '',
                                sectionCode: sectionItem ? sectionItem.sectionCode : '',
                            }));
                        }}
                        loadPage={loadSections}
                        getId={(sectionItem) => sectionItem.id}
                        getLabel={sectionLabel}
                    />

                    <LazySelect<EnrolledStudentMaintenanceItem>
                        label={t('Alumno')}
                        placeholder={t('Seleccione alumno...')}
                        value={student}
                        onChange={(studentItem) => {
                            setStudent(
                                studentItem ? { id: studentItem.id, label: studentLabel(studentItem) } : null,
                            );
                            setCodes((prev) => ({
                                sectionCode: prev?.sectionCode || '',
                                studentCode: studentItem ? studentItem.studentCode : '',
                            }));
                        }}
                        loadPage={loadStudents}
                        getId={(studentItem) => studentItem.id}
                        getLabel={studentLabel}
                    />

                    {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        {t('dialog.actions.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!canSave} loading={saving}>
                        {t('Guardar')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}