import React, { useState } from 'react';

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  className = 'form-input',
  required,
  autoFocus,
  ...rest
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoFocus={autoFocus}
        style={{ paddingRight: 44 }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide' : 'Show'}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 8px',
          fontSize: 16,
          lineHeight: 1,
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
