import { useRef, useState, useEffect } from 'react';

const PinInput = ({ length = 4, onComplete, value = '', onChange }) => {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  // Sync with outer value if provided (e.g. to clear wrong PINs)
  useEffect(() => {
    if (value === '') {
      setDigits(Array(length).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } else {
      const valArr = value.split('').slice(0, length);
      const newDigits = [...valArr, ...Array(length - valArr.length).fill('')];
      setDigits(newDigits);
    }
  }, [value, length]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Numbers only
    if (!val) return;

    const newDigits = [...digits];
    // Take the last typed character
    newDigits[index] = val.substring(val.length - 1);
    setDigits(newDigits);

    const pinString = newDigits.join('');
    if (onChange) {
      onChange(pinString);
    }

    // Auto focus next input if not the last one
    if (index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // If fully filled, trigger completion callback
    if (pinString.length === length && onComplete) {
      onComplete(pinString);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      
      // If current digit is empty and we can go back, go back and clear previous
      if (!newDigits[index] && index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1].focus();
        
        const pinString = newDigits.join('');
        if (onChange) {
          onChange(pinString);
        }
      } else {
        // Just clear current digit
        newDigits[index] = '';
        setDigits(newDigits);
        
        const pinString = newDigits.join('');
        if (onChange) {
          onChange(pinString);
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, length);
    if (pasteData) {
      const valArr = pasteData.split('');
      const newDigits = [...valArr, ...Array(length - valArr.length).fill('')];
      setDigits(newDigits);
      
      const pinString = newDigits.join('');
      if (onChange) {
        onChange(pinString);
      }
      
      // Focus appropriate input box
      const focusIndex = Math.min(pasteData.length, length - 1);
      inputRefs.current[focusIndex].focus();

      if (pinString.length === length && onComplete) {
        onComplete(pinString);
      }
    }
  };

  return (
    <div className="flex justify-center items-center gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          ref={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 sm:w-14 sm:h-16 bg-surface border-2 border-gray-150 rounded-2xl text-center font-display font-bold text-2xl text-brand-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-inner transition-all"
        />
      ))}
    </div>
  );
};

export default PinInput;
