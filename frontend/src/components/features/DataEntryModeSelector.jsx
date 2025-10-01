import React from 'react';
import { Calculator, Target, Zap } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';

/**
 * Data Entry Mode Options
 */
export const DATA_ENTRY_MODES = {
  FINAL_SCORE: 'final_score',
  FRAME_BY_FRAME: 'frame_by_frame',
  PIN_BY_PIN: 'pin_by_pin'
};

/**
 * Mode configuration with display info
 */
const MODE_CONFIG = {
  [DATA_ENTRY_MODES.FINAL_SCORE]: {
    title: 'Final Score',
    description: 'Enter your total score with optional strikes/spares',
    icon: Calculator,
    benefits: ['Quick entry', 'Perfect for completed games', 'Add strikes/spares for detail']
  },
  [DATA_ENTRY_MODES.FRAME_BY_FRAME]: {
    title: 'Frame by Frame',
    description: 'Enter scores for each of the 10 frames',
    icon: Target,
    benefits: ['Moderate detail', 'Good for tracking progress', 'Frame-level analysis']
  },
  [DATA_ENTRY_MODES.PIN_BY_PIN]: {
    title: 'Pin by Pin',
    description: 'Enter each throw individually for maximum detail',
    icon: Zap,
    benefits: ['Maximum detail', 'Perfect for live games', 'Complete throw analysis']
  }
};

/**
 * Data Entry Mode Selector Component
 */
const DataEntryModeSelector = ({ selectedMode, onModeSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal-800 mb-2">How would you like to enter your game?</h2>
        <p className="text-charcoal-600">Choose the method that works best for you</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(MODE_CONFIG).map(([mode, config]) => {
          const Icon = config.icon;
          const isSelected = selectedMode === mode;

          return (
            <Card
              key={mode}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                isSelected 
                  ? 'ring-2 ring-vintage-red-500 bg-vintage-red-50 border-vintage-red-200 shadow-lg' 
                  : 'hover:border-charcoal-300 hover:shadow-md'
              }`}
              onClick={() => onModeSelect(mode)}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className={`mx-auto w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-vintage-red-500 text-white shadow-lg' 
                      : 'bg-charcoal-100 text-charcoal-600'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className={`font-bold text-xl mb-2 ${
                      isSelected ? 'text-vintage-red-700' : 'text-charcoal-800'
                    }`}>
                      {config.title}
                    </h3>
                    <p className="text-sm text-charcoal-600 leading-relaxed">
                      {config.description}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    {config.benefits.map((benefit, index) => (
                      <div key={index} className="text-xs text-charcoal-500 flex items-center justify-center">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          isSelected ? 'bg-vintage-red-400' : 'bg-charcoal-400'
                        }`} />
                        {benefit}
                      </div>
                    ))}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="text-xs font-semibold text-vintage-red-600 bg-vintage-red-100 rounded-full px-4 py-2 inline-block border border-vintage-red-200">
                      ✓ Selected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DataEntryModeSelector;