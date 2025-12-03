const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    '&:hover': {
      borderColor: 'hsl(var(--primary))',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'hsl(var(--primary))' : state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--dropdown-background))',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    '&:active': {
      backgroundColor: 'hsl(var(--primary))',
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  input: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--dropdown-background))',
    borderColor: 'hsl(var(--border))',
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '300px', // Increased for better visibility
    overflowY: 'auto', 
  }),
  multiValue: (styles) => ({
    ...styles,
    backgroundColor: 'hsl(var(--primary-foreground))',
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: 'hsl(var(--primary))',
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    color: 'hsl(var(--primary))',
    ':hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
};

export { customStyles };