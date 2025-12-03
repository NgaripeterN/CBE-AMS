import React from 'react';
import Select from 'react-select';
import { customStyles } from '../styles/react-select-styles'; // Assuming customStyles are defined here

const CompetencySelector = ({ availableCompetencies, selectedIds, onChange }) => {

  const groupOptions = (competencies) => {
    const grouped = (competencies || []).reduce((acc, comp) => {
      const category = comp.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ value: comp.id, label: comp.name });
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, options]) => ({
      label: category,
      options: options,
    }));
  };

  const options = groupOptions(availableCompetencies);

  const handleChange = (selectedOptions) => {
    onChange(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const selectedOptions = availableCompetencies
    ? availableCompetencies
        .filter(comp => selectedIds.includes(comp.id))
        .map(comp => ({ value: comp.id, label: comp.name }))
    : [];

  if (!availableCompetencies || availableCompetencies.length === 0) {
    return <p className="text-muted-foreground">No competencies associated with this course. Please contact an admin.</p>;
  }

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      styles={customStyles}
      placeholder="Select competencies..."
      className="text-foreground"
    />
  );
};

export default CompetencySelector;
