import { useContext, useRef, useState } from 'react';
import { ApiContext, DappContext, WagmiContext } from '../../App';
import { ConfigContext } from './Config';
import {
  Button,
  Dropdown,
  DropdownButton,
  InputGroup,
  Form,
} from 'react-bootstrap';
import { Authorize } from '../buttons/Authorize';
import SelectNetwork from '../forms/NetworkSelection';

export default function CustomConfig() {
  const { currentNetwork, user, signature, onRequest } =
    useContext(DappContext);

  const validating = useRef(false);
  const [feedback, setFeedback] = useState();

  const [input, setInput] = useState({
    target: 'rpc',
    network: currentNetwork(),
    value: '',
  });

  function editInput(key, value) {
    setInput({ ...input, [key]: value });
  }

  function selectNetwork(event) {
    event.preventDefault();
    if (validating.current) return;
    editInput('network', event.target.name);
    if (feedback) setFeedback();
  }

  function selectTarget(event) {
    event.preventDefault();
    if (validating.current) return;
    editInput('target', event.target.name);
    if (feedback) setFeedback();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (validating.current) return;
    validating.current = true;
    fetch('config', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: user.current,
        input,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            `${res.status} - ${res.statusText} - ${data.toString()}`
          );
        setFeedback(data.toString());
        onRequest();
      })
      .catch((e) => setFeedback(e.toString()))
      .finally(() => (validating.current = false));
  }

  return (
    <div>
      <h6>Custom RPC & Scanner API Keys</h6>
      <InputGroup>
        <SelectNetwork form="Customize" onClick={selectNetwork} />
        <InputGroup.Text>{input.network}</InputGroup.Text>
      </InputGroup>
      <br />
      <InputGroup>
        <DropdownButton title="Target">
          <Dropdown.Item name="rpc" onClick={selectTarget}>
            RPC
          </Dropdown.Item>
          <Dropdown.Item name="scanner" onClick={selectTarget}>
            Scanner
          </Dropdown.Item>
        </DropdownButton>
        <InputGroup.Text>{input.target}</InputGroup.Text>
        <Form.Control
          disabled={validating.current}
          onChange={(event) => editInput('value', event.target.value)}
        />
      </InputGroup>
      <br />
      <InputGroup>
        {!signature ? (
          <Authorize />
        ) : (
          <Button disabled={validating.current} onClick={handleSubmit}>
            Submit
          </Button>
        )}
      </InputGroup>
      {feedback && <div>{feedback}</div>}
    </div>
  );
}
