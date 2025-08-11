import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface SubjectSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const SubjectSelect = ({
  value,
  onValueChange,
  label = 'Subject',
  placeholder = 'Choose a subject',
  required = false
}: SubjectSelectProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to render the selected subject as a badge
  const renderSelectedSubject = () => {
    if (!value) return null;
    
    const selectedSubject = subjects.find(subject => subject.id === value);
    if (!selectedSubject) return value;
    
    return (
      <Badge className={selectedSubject.color || 'bg-muted text-muted-foreground'}>
        {selectedSubject.name}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="subject">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger id="subject" className="w-full">
          <SelectValue placeholder={placeholder}>
            {renderSelectedSubject()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="p-2 text-center text-muted-foreground">Loading subjects...</div>
          ) : subjects.length > 0 ? (
            subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <Badge className={subject.color || 'bg-muted text-muted-foreground'}>
                    {subject.name}
                  </Badge>
                  {subject.description && (
                    <span className="text-xs text-muted-foreground">{subject.description}</span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-muted-foreground">No subjects found</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};