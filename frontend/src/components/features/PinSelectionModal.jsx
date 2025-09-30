import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Individual Pin Component
 */
const Pin = ({ 
  pinNumber, 
  isKnockedDown, 
  isDisabled = false,
  onClick 
}) => {
  return (
    <button
      className={`
        w-8 h-12 rounded-t-full rounded-b-sm transition-all duration-200 border-2
        ${isKnockedDown 
          ? 'bg-vintage-red-500 border-vintage-red-600 text-white' 
          : 'bg-white border-charcoal-300 text-charcoal-900 hover:bg-charcoal-50'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        font-bold text-sm shadow-md
      `}
      onClick={() => !isDisabled && onClick && onClick(pinNumber)}
      disabled={isDisabled}
    >
      {pinNumber}
    </button>
  );
};

/**
 * Pin Deck Layout Component
 */
const PinDeck = ({ 
  knockedDownPins = [], 
  availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  onPinClick 
}) => {
  // Traditional bowling pin arrangement (4-3-2-1 triangle)
  const pinRows = [
    [7, 8, 9, 10], // Back row
    [4, 5, 6],     // Third row  
    [2, 3],        // Second row
    [1]            // Front row (headpin)
  ];

  return (
    <div className="flex flex-col items-center space-y-3 py-8">
      {pinRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {row.map(pinNumber => (
            <Pin
              key={pinNumber}
              pinNumber={pinNumber}
              isKnockedDown={knockedDownPins.includes(pinNumber)}
              isDisabled={!availablePins.includes(pinNumber)}
              onClick={onPinClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Pin Selection Modal Component
 */
const PinSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  frameNumber = 1,
  throwNumber = 1,
  previousThrows = [],
  maxPins = 10
}) => {
  const [selectedPins, setSelectedPins] = useState([]);
  const [availablePins, setAvailablePins] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Calculate available pins based on previous throws in the frame
  useEffect(() => {
    if (frameNumber < 10) {
      // Regular frames 1-9
      if (throwNumber === 1) {
        // First throw - all pins available
        setAvailablePins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      } else if (throwNumber === 2) {
        // Second throw - only pins not knocked down in first throw
        const firstThrowPins = previousThrows[0] || 0;
        if (firstThrowPins === 10) {
          // Strike - no second throw needed
          setAvailablePins([]);
        } else {
          // Calculate which pins are still standing
          const maxPossible = 10 - firstThrowPins;
          const availableCount = Math.min(maxPossible, maxPins);
          setAvailablePins(Array.from({ length: 10 }, (_, i) => i + 1).slice(0, availableCount));
        }
      }
    } else {
      // 10th frame - special rules
      setAvailablePins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    
    setSelectedPins([]);
  }, [isOpen, frameNumber, throwNumber, previousThrows, maxPins]);

  const handlePinClick = (pinNumber) => {
    setSelectedPins(prev => {
      if (prev.includes(pinNumber)) {
        return prev.filter(p => p !== pinNumber);
      } else {
        const newSelection = [...prev, pinNumber].sort((a, b) => a - b);
        
        // Validate selection doesn't exceed limits
        if (frameNumber < 10 && throwNumber === 2) {
          const firstThrowPins = previousThrows[0] || 0;
          if (firstThrowPins + newSelection.length > 10) {
            return prev; // Don't add if it would exceed 10 total
          }
        }
        
        if (newSelection.length <= maxPins) {
          return newSelection;
        }
        return prev;
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedPins.length);
    onClose();
  };

  const handleClear = () => {
    setSelectedPins([]);
  };

  const getModalTitle = () => {
    if (frameNumber === 10) {
      return `Frame 10 - Throw ${throwNumber}`;
    }
    return `Frame ${frameNumber} - ${throwNumber === 1 ? 'First' : 'Second'} Throw`;
  };

  const getInstructions = () => {
    if (frameNumber < 10 && throwNumber === 2) {
      const firstThrowPins = previousThrows[0] || 0;
      const remaining = 10 - firstThrowPins;
      return `Select pins knocked down (max ${remaining} remaining)`;
    }
    return 'Select pins knocked down';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <div className="max-w-md mx-auto">
        {/* Instructions */}
        <div className="text-center mb-6">
          <p className="text-charcoal-600 mb-2">{getInstructions()}</p>
          <p className="text-lg font-bold text-charcoal-900">
            Pins Selected: {selectedPins.length}
          </p>
        </div>

        {/* Pin Deck */}
        <PinDeck 
          knockedDownPins={selectedPins}
          availablePins={availablePins}
          onPinClick={handlePinClick}
        />

        {/* Selected Pins Display */}
        {selectedPins.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-sm text-charcoal-600 mb-2">Selected Pins:</p>
            <div className="flex justify-center space-x-1">
              {selectedPins.map(pin => (
                <span 
                  key={pin}
                  className="bg-vintage-red-100 text-vintage-red-800 px-2 py-1 rounded text-sm font-bold"
                >
                  {pin}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            variant="secondary" 
            onClick={handleClear}
            disabled={selectedPins.length === 0}
            className="flex-1"
          >
            Clear
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            className="flex-1"
          >
            Confirm {selectedPins.length} Pin{selectedPins.length !== 1 ? 's' : ''}
          </Button>
        </div>

        {/* Quick Select Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedPins([])}
            className="text-xs"
          >
            Gutter (0)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (frameNumber < 10 && throwNumber === 2) {
                const firstThrowPins = previousThrows[0] || 0;
                const remaining = 10 - firstThrowPins;
                setSelectedPins(Array.from({ length: remaining }, (_, i) => i + 1));
              } else {
                setSelectedPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
              }
            }}
            className="text-xs"
          >
            {frameNumber < 10 && throwNumber === 2 
              ? `Spare (${10 - (previousThrows[0] || 0)})` 
              : 'Strike (10)'
            }
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const maxAvailable = frameNumber < 10 && throwNumber === 2 
                ? 10 - (previousThrows[0] || 0)
                : 10;
              const halfPins = Math.floor(maxAvailable / 2);
              setSelectedPins(Array.from({ length: halfPins }, (_, i) => i + 1));
            }}
            className="text-xs"
          >
            Half
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PinSelectionModal;