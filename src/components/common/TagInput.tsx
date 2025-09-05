import React, { useState } from 'react';
import { Box, Chip, TextField } from '@mui/material';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ label, value, onChange, placeholder, suggestions }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);

  const add = (raw: string) => {
    const token = raw.trim();
    if (!token) return;
    if (value.includes(token)) return;
    onChange([...value, token]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type and press Enter'}
        onFocus={()=> setFocused(true)}
        onBlur={()=> setTimeout(()=> setFocused(false), 100)}
      />
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {value.map((t) => (
          <Chip key={t} label={t} onDelete={() => remove(t)} />)
        )}
      </Box>
      {focused && suggestions && suggestions.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {suggestions
            .filter(s => s.toLowerCase().includes(input.toLowerCase()))
            .filter(s => !value.includes(s))
            .slice(0, 8)
            .map(s => (
              <Chip key={s} label={s} variant="outlined" onClick={() => add(s)} />
            ))}
        </Box>
      )}
    </Box>
  );
};

export default TagInput;
