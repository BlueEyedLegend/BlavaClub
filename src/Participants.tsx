import styled from 'styled-components';
import { Section, Button, Input } from './styles';
import React, { FC, useState, ChangeEvent, KeyboardEvent } from 'react';

import { MAX_PARTICIPANTS } from './App';
import { capitalize } from './utils';

const ListItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ListItem = styled.li`
  width: 100%;
  padding: 10px;
  margin: 5px;
  background-color: #f9f9f9;
  border-radius: 5px;
  list-style: none;
  color: #282c34;
  font-weight: bold;
  font-size: 1rem;
`;


const ErrorMessage = styled.p`
  color: red;
`;

interface ParticipantsProps {
  handleAddChoice: (name: string) => void;
  handleRemoveOption: (index: number) => void;
  names: string[];
}

export const Participants: FC<ParticipantsProps> = ({
  handleAddChoice,
  handleRemoveOption,
  names,
}) => {
  const [option, setOption] = useState('');
  const [error, setError] = useState('');

  const isMaxParticipantsReached = names.length >= MAX_PARTICIPANTS;
  const hasParticipants = names.length > 0;

  const validateInput = (name: string) => {
    const specialCharPattern = /[^a-zA-Z0-9 ]/;
    if (!name.trim()) {
      return 'Name cannot be empty.';
    }
    if (specialCharPattern.test(name)) {
      return 'Name cannot contain special characters.';
    }
    return '';
  };

  const handleAddOption = () => {
    const validationError = validateInput(option);
    if (validationError) {
      setError(validationError);
    } else {
      handleAddChoice(option);
      setOption('');
      setError('');
    }
  };

  return (
    <Section>
      <h2>Add Options</h2>
      <Input
        disabled={isMaxParticipantsReached}
        type="text"
        placeholder="Enter option"
        value={option}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setOption(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            handleAddOption();
          }
        }}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isMaxParticipantsReached && <ErrorMessage>Max participants reached.</ErrorMessage>}
      <Button disabled={isMaxParticipantsReached} onClick={handleAddOption}>
        Add
      </Button>
      <h2>Options</h2>
      <ul>
        {names.map((name, index) => (
          <ListItemContainer key={index}>
            <ListItem>{capitalize(name)}</ListItem>
            <Button onClick={() => handleRemoveOption(index)}>Del</Button>
          </ListItemContainer>
        ))}
      </ul>
    </Section>
  );
};

export default Participants;
