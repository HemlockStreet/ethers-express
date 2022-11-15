import { useContext, useState, createContext } from 'react';
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
import { chain, useBalance } from 'wagmi';
import { isAddress } from 'ethers/lib/utils';

const CashoutContext = createContext(null);

function GasForm() {
  const { selected, input, setInput, handleSubmit } =
    useContext(CashoutContext);
  const { signature } = useContext(ConfigContext);

  return (
    <InputGroup>
      <InputGroup.Text>Amount</InputGroup.Text>
      <Form.Control
        name="value"
        aria-label="Amount"
        type="number"
        placeholder="0.05"
        min="0.000000000000000001"
        onChange={(e) => {
          if (e.target.value > 0) {
            let val = e.target.value.toString();

            if (Math.abs(val) < 1.0) {
              var ex = parseInt(val.toString().split('e-')[1]);
              if (ex) {
                val *= Math.pow(10, ex - 1);
                val =
                  '0.' + new Array(ex).join('0') + val.toString().substring(2);
              }
            } else {
              var ex = parseInt(val.toString().split('+')[1]);
              if (ex > 20) {
                ex -= 20;
                val /= Math.pow(10, ex);
                val += new Array(ex + 1).join('0');
              }
            }

            if (val !== input.value) setInput({ value: val });
          }
        }}
      />
      <InputGroup.Text>{chain[selected].nativeCurrency.symbol}</InputGroup.Text>
      {!signature ? (
        <GetSignature />
      ) : (
        <Button disabled={input.value === '0'} onClick={handleSubmit}>
          Submit
        </Button>
      )}
    </InputGroup>
  );
}

function TokenForm() {
  const { type, input, setInput, handleSubmit } = useContext(CashoutContext);
  const { signature } = useContext(ConfigContext);

  return (
    <InputGroup>
      <InputGroup.Text>Address</InputGroup.Text>
      <Form.Control
        placeholder="0x..."
        onChange={(e) => {
          e.preventDefault();
          setInput({ ...input, address: e.target.value });
        }}
      />
      <InputGroup.Text>{type === 'ERC20' ? 'Amount' : 'ID'}</InputGroup.Text>
      <Form.Control
        name="value"
        aria-label="Amount"
        type="number"
        placeholder="0.05"
        min="0.000000000000000001"
        onChange={(e) => {
          if (e.target.value > 0) {
            let val = e.target.value.toString();

            if (Math.abs(val) < 1.0) {
              var ex = parseInt(val.toString().split('e-')[1]);
              if (ex) {
                val *= Math.pow(10, ex - 1);
                val =
                  '0.' + new Array(ex).join('0') + val.toString().substring(2);
              }
            } else {
              var ex = parseInt(val.toString().split('+')[1]);
              if (ex > 20) {
                ex -= 20;
                val /= Math.pow(10, ex);
                val += new Array(ex + 1).join('0');
              }
            }

            if (val !== input.value) setInput({ ...input, value: val });
          }
        }}
      />
      {!signature ? (
        <GetSignature />
      ) : (
        <Button
          disabled={
            !isAddress(input.address) ||
            (type === 'ERC20' && input.value === '0')
          }
          onClick={handleSubmit}
        >
          Submit
        </Button>
      )}
    </InputGroup>
  );
}

export function Cashout() {
  const { report } = useContext(Web2Context);
  const { account, network } = useContext(Web3Context);
  const { signature, setSignature } = useContext(ConfigContext);

  const deployerBalance = useBalance({
    addressOrName: report.deployer,
    watch: true,
    formatUnits: 'ether',
  });

  const [selected, setSelected] = useState(
    (() => {
      const chainId = network.chain.id;
      let result;
      Object.keys(chain).forEach((name) => {
        const thisChain = chain[name];
        if (chainId === thisChain.id) result = name;
      });
      return result;
    })()
  );
  const [type, setType] = useState('gas');
  const [input, setInput] = useState({ value: '0' });

  function handleSubmit(event) {
    event.preventDefault();
    const user = {
      address: account.address,
      message: Object.keys(signature)[0],
      signature: signature[Object.keys(signature)[0]],
    };

    fetch('cashout', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        input: { network: selected, type, ...input },
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
        await res.json();
        setSignature();
      })
      .catch((e) => {
        console.error(e.toString());
      });
  }

  return (
    <div>
      <h6>Cash Out</h6>
      <InputGroup>
        <DropdownButton title="Network">
          {report.networks.map((name) => (
            <Dropdown.Item
              key={`change-rpc-dropdown-${name}`}
              onClick={(e) => {
                e.preventDefault();
                setSelected(name);
                setInput({ value: '0' });
              }}
            >
              {name}
            </Dropdown.Item>
          ))}
        </DropdownButton>
        <InputGroup.Text>{selected}</InputGroup.Text>
        <DropdownButton title="Asset Type">
          <Dropdown.Item
            onClick={(e) => {
              e.preventDefault();
              setType('gas');
            }}
          >
            Native Token (Gas)
          </Dropdown.Item>
          <Dropdown.Item
            onClick={(e) => {
              e.preventDefault();
              setType('ERC20');
            }}
          >
            ERC20
          </Dropdown.Item>
          <Dropdown.Item
            onClick={(e) => {
              e.preventDefault();
              setType('ERC721');
            }}
          >
            ERC721
          </Dropdown.Item>
        </DropdownButton>

        {type && (
          <InputGroup.Text>
            {type !== 'gas' ? type : 'Native Token (Gas)'}
          </InputGroup.Text>
        )}
      </InputGroup>
      <br />
      <CashoutContext.Provider
        value={{
          type,
          selected,
          input,
          setInput,
          handleSubmit,
          deployerBalance,
        }}
      >
        {type === 'gas' ? <GasForm /> : <TokenForm />}
      </CashoutContext.Provider>
    </div>
  );
}
