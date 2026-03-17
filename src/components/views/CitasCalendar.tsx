import { useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

// ---------- Status color map ----------
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    pendiente: { bg: '#eab308', border: '#ca8a04', text: '#000000' },
    confirmada: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
    'en-ejecucion': { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
    completada: { bg: '#22c55e', border: '#16a34a', text: '#000000' },
    cancelado: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
    cancelada: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
};

// ---------- Props ----------
interface CitasCalendarProps {
    citasByDate: Record<string, any[]>;
    selectedDate: string | null;
    onSelectDay: (dateStr: string) => void;
    onEventClick: (cita: any) => void;
}

export function CitasCalendar({
    citasByDate,
    selectedDate,
    onSelectDay,
    onEventClick,
}: CitasCalendarProps) {
    const calendarRef = useRef<FullCalendar>(null);

    const events: EventInput[] = useMemo(() => {
        const result: EventInput[] = [];
        for (const [date, citas] of Object.entries(citasByDate)) {
            for (const cita of citas) {
                const colors = STATUS_COLORS[cita.estado?.toLowerCase()] || STATUS_COLORS.pendiente;
                result.push({
                    id: String(cita.id_cita),
                    title: `${cita.hora_inicio_corta} — ${cita.servicio_nombre || 'Servicio'}`,
                    date, 
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    textColor: colors.text,
                    extendedProps: { cita },
                });
            }
        }
        return result;
    }, [citasByDate]);

    const handleDateClick = (info: DateClickArg) => onSelectDay(info.dateStr);

    const handleEventClick = (info: EventClickArg) => {
        const cita = info.event.extendedProps.cita;
        if (cita) onEventClick(cita);
    };

    useEffect(() => {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        document.querySelectorAll('.fc-daygrid-day.citas-selected-day').forEach(el =>
            el.classList.remove('citas-selected-day'),
        );
        if (selectedDate) {
            const cell = document.querySelector(`.fc-daygrid-day[data-date="${selectedDate}"]`);
            if (cell) cell.classList.add('citas-selected-day');
        }
    }, [selectedDate, events]); 

    return (
        <div className="citas-fullcalendar">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="es"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                buttonText={{ today: 'Hoy' }}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                dayMaxEventRows={3}
                moreLinkText={(n) => `+${n} más`}
                firstDay={0} 
                fixedWeekCount={false}
                eventDisplay="block"
                dayHeaderFormat={{ weekday: 'short' }}
            />
        </div>
    );
}