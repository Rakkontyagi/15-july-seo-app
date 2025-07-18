
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import calendar CSS

interface ContentEvent {
  date: Date;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'published';
}

interface ContentCalendarProps {
  events: ContentEvent[];
  onAddEvent?: (event: ContentEvent) => void;
  onEditEvent?: (eventId: string, updatedEvent: ContentEvent) => void;
  className?: string;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({
  events,
  onAddEvent,
  onEditEvent,
  className,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');

  const handleDateChange = (date: Date | Date[]) => {
    if (Array.isArray(date)) {
      setSelectedDate(date[0]);
    } else {
      setSelectedDate(date);
    }
  };

  const handleAddEvent = () => {
    if (selectedDate && newEventTitle.trim() && onAddEvent) {
      onAddEvent({
        date: selectedDate,
        title: newEventTitle.trim(),
        status: 'planned',
      });
      setNewEventTitle('');
      setSelectedDate(null);
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = events.filter(
        (event) => event.date.toDateString() === date.toDateString()
      );
      return (
        <div className="flex flex-col items-center justify-center h-full">
          {dayEvents.map((event, index) => (
            <div
              key={index}
              className={`text-xs rounded-full px-1 mt-0.5 ${event.status === 'published' ? 'bg-green-500' : event.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
            >
              {event.title.substring(0, 5)}...
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Content Calendar</h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-2/3">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full"
          />
        </div>
        <div className="md:w-1/3">
          {selectedDate && (
            <div className="border p-3 rounded-md">
              <h4 className="font-semibold mb-2">Events for {selectedDate.toDateString()}</h4>
              {
                events.filter(event => event.date.toDateString() === selectedDate.toDateString()).length === 0 ? (
                  <p className="text-gray-500 text-sm">No events for this date.</p>
                ) : (
                  <ul className="space-y-1">
                    {events.filter(event => event.date.toDateString() === selectedDate.toDateString()).map((event, index) => (
                      <li key={index} className="text-sm">
                        <span className={`font-medium ${event.status === 'published' ? 'text-green-600' : event.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {event.title}
                        </span>
                        <span className="text-gray-500"> ({event.status})</span>
                      </li>
                    ))}
                  </ul>
                )
              }
              {onAddEvent && (
                <div className="mt-3">
                  <Input
                    type="text"
                    placeholder="New event title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={handleAddEvent} className="w-full">
                    Add Event
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;
