import styled from 'styled-components';

import { Participants } from './Participants';
import { Wheel } from './Wheel';

import './App.css';
import { useState } from 'react';
import { Header } from './Header';

const Main = styled.main`
  display: flex;
  justify-content: space-around;
  padding: 20px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    align-items: center;
  }
`;

export const MAX_PARTICIPANTS = 18;

function App() {
  const [names, setNames] = useState<string[]>([]);

  const handleAddChoice = (name: string) => {
    if (names.length < MAX_PARTICIPANTS) {
      setNames([...names, name]);
    }
  };

  const handleRemoveOption = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  return (
    <>
      <Header />
      <Main>
        <Participants
          handleAddChoice={handleAddChoice}
          handleRemoveOption={handleRemoveOption}
          names={names}
        />
        <Wheel participants={names} />
      </Main>
    </>
  );
}

export default App;
