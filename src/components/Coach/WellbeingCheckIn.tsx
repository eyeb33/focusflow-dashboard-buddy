import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useCoach } from '@/contexts/CoachContext';

interface WellbeingCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['Exhausted', 'Tired', 'Okay', 'Good', 'Energized'];
const STRESS_LABELS = ['Calm', 'Relaxed', 'Moderate', 'Stressed', 'Overwhelmed'];

const WellbeingCheckIn: React.FC<WellbeingCheckInProps> = ({ open, onOpenChange }) => {
  const { submitCheckIn } = useCoach();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await submitCheckIn(mood, energy, stress, notes);
    // Reset form
    setMood(3);
    setEnergy(3);
    setStress(3);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wellbeing Check-in</DialogTitle>
          <DialogDescription>
            How are you feeling right now? This helps me provide better support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mood */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mood</label>
              <span className="text-2xl">{MOOD_EMOJIS[mood - 1]}</span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Energy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Energy Level</label>
              <span className="text-sm text-muted-foreground">{ENERGY_LABELS[energy - 1]}</span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={(value) => setEnergy(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Stress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Stress Level</label>
              <span className="text-sm text-muted-foreground">{STRESS_LABELS[stress - 1]}</span>
            </div>
            <Slider
              value={[stress]}
              onValueChange={(value) => setStress(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you'd like to share?"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WellbeingCheckIn;
