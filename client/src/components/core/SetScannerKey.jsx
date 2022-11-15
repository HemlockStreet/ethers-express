import { useContext, useState } from 'react';
import { Web2Context, Web3Context } from '../../App';
import { ConfigContext } from './Config';
import {
  Button,
  Dropdown,
  DropdownButton,
  InputGroup,
  Form,
} from 'react-bootstrap';
import GetSignature from '../wagmi/SignMessage';

export function SetScannerKey() {
  const { report, getReport, setSignature } = useContext(Web2Context);
  const { account } = useContext(Web3Context);
  const { signature } = useContext(ConfigContext);

  const [selected, setSelected] = useState();
  const [value, setValue] = useState();

  function handleSubmit(event) {
    event.preventDefault();
    const user = {
      address: account.address,
      message: Object.keys(signature)[0],
      signature: signature[Object.keys(signature)[0]],
    };
    fetch('configure', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        target: 'scanner',
        input: { network: selected, value },
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
        await res.json();
        getReport();
        setSignature();
      })
      .catch((e) => {
        console.error(e.toString());
      });
  }

  return (
    <div>
      <h6>Set Scanner Key</h6>
      <InputGroup>
        <DropdownButton title="Network">
          {report.networks.map((name) => (
            <Dropdown.Item
              key={`change-rpc-dropdown-${name}`}
              onClick={(e) => {
                e.preventDefault();
                setSelected(name);
              }}
            >
              {name}
            </Dropdown.Item>
          ))}
        </DropdownButton>
        {selected && <InputGroup.Text>{selected}</InputGroup.Text>}

        <Form.Control
          disabled={!report.networks.includes(selected)}
          onChange={(e) => {
            e.preventDefault();
            setValue(e.target.value);
          }}
        />

        {!signature ? (
          <GetSignature />
        ) : (
          <Button
            disabled={!report.networks.includes(selected) && value !== ''}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        )}
      </InputGroup>
    </div>
  );
}
