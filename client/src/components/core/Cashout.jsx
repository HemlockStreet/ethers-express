import { useContext, useState, createContext, useRef } from 'react';
import { ApiContext } from '../../App';
import { DappContext } from '../../App';
import {
  Button,
  Dropdown,
  DropdownButton,
  InputGroup,
  Form,
} from 'react-bootstrap';
import { Authorize } from '../buttons/Authorize';
import { chain, useBalance, useProvider, useContract } from 'wagmi';
import { isAddress } from 'ethers/lib/utils';
import SelectNetwork from '../forms/NetworkSelection';
import { UintForm } from '../forms/FormControls';
import { ethers } from 'ethers';

const nftAbi = require(`../wagmi/interfaces/ERC721.json`).abi;
const tknAbi = require(`../wagmi/interfaces/ERC20.json`).abi;

const CashoutContext = createContext(null);

function GasForm() {
  const { input, formValidated, setValue } = useContext(CashoutContext);

  return (
    <InputGroup>
      <InputGroup.Text>Amount</InputGroup.Text>
      <UintForm disabled={formValidated} onChange={setValue} />
      <InputGroup.Text>
        {chain[input.network].nativeCurrency.symbol}
      </InputGroup.Text>
    </InputGroup>
  );
}

function TokenForm() {
  const { input, formValidated, setAddress, setValue } =
    useContext(CashoutContext);

  return (
    <InputGroup>
      <InputGroup.Text>Address</InputGroup.Text>
      <Form.Control
        placeholder="0x..."
        disabled={formValidated}
        onChange={(event) => setAddress(event.target.value)}
      />

      <InputGroup.Text>
        {input.assetType === 'ERC20' ? 'Amount' : 'ID'}
      </InputGroup.Text>
      <UintForm disabled={formValidated} onChange={setValue} />
    </InputGroup>
  );
}

function NftForm() {
  const { input, formValidated, setAddress, setValue } =
    useContext(CashoutContext);

  return (
    <InputGroup>
      <InputGroup.Text>Address</InputGroup.Text>
      <Form.Control
        placeholder="0x..."
        disabled={formValidated}
        onChange={(event) => setAddress(event.target.value)}
      />

      <InputGroup.Text>
        {input.assetType === 'ERC20' ? 'Amount' : 'ID'}
      </InputGroup.Text>
      <UintForm disabled={formValidated} onChange={setValue} />
    </InputGroup>
  );
}

export function Cashout() {
  const { report } = useContext(ApiContext);
  const { idOf, currentNetwork, user, signature, onRequest } =
    useContext(DappContext);

  const validating = useRef(false);
  const [feedback, setFeedback] = useState();

  const [input, setInput] = useState({
    network: currentNetwork(),
    assetType: 'gas',
    value: '0',
  });

  const [formValidated, setFormValidated] = useState(false);

  function execute(event) {
    event.preventDefault();
    if (validating.current) return;
    validating.current = true;
    fetch('cashout', {
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
      .finally(() => {
        validating.current = false;
      });
  }

  function selectNetwork(event) {
    event.preventDefault();
    if (validating.current) return;
    setInput({
      ...input,
      network: event.target.name,
    });
    if (formValidated) setFormValidated(false);
    if (feedback) setFeedback();
  }

  function selectAssetType(event) {
    event.preventDefault();
    if (validating.current) return;
    const name = event.target.name;
    setInput({
      ...input,
      assetType: name,
      value: name === 'ERC721' ? '0' : '0.0',
      address: '',
    });
    if (formValidated) setFormValidated(false);
    if (feedback) setFeedback();
  }

  function editInput(key, value) {
    setInput({ ...input, [key]: value });
  }

  const setValue = (value) => {
    if (value !== input.value) editInput('value', value);
  };

  const setAddress = (value) => {
    editInput('address', value);
  };

  const selected = () => input;

  const provider = useProvider({ chainId: idOf(selected().network) });

  const deployerBalance = useBalance({
    addressOrName: report.deployer,
    watch: true,
    formatUnits: 'ether',
    chainId: idOf(selected().network),
  });

  const proper = () => {
    if (
      ['gas', 'ERC20'].includes(
        selected().assetType && !['0.0', '0'].includes(selected().value)
      )
    )
      return false;

    if (
      ['ERC721', 'ERC20'].includes(selected().assetType) &&
      !isAddress(selected().address)
    )
      return false;

    if (selected().assetType === 'ERC721' && selected().value.includes('.'))
      return false;

    return true;
  };

  function assessGas() {
    if (parseFloat(input.value) <= 0) {
      setFeedback('Invalid Input');
      return;
    }

    if (parseFloat(deployerBalance.data) < parseFloat(input.value)) {
      setFeedback('Insufficient Funds');
      return;
    }

    setFormValidated(true);
    if (feedback) setFeedback();
  }

  let tkn = useContract({
    signerOrProvider: provider,
    address: selected().address,
    abi: tknAbi,
  });

  let nft = useContract({
    signerOrProvider: provider,
    address: selected().address,
    abi: nftAbi,
  });

  function assessTkn() {
    tkn
      .balanceOf(report.deployer)
      .then(async (data) => {
        const decimals = await tkn.decimals();
        const balance = parseInt(data.toString()) / 10 ** decimals;

        if (parseFloat(input.value) <= 0) {
          setFeedback('Invalid Input');
          return;
        }

        if (parseFloat(balance) < parseFloat(input.value)) {
          setFeedback('Insufficient Funds');
          return;
        }

        setFormValidated(true);
        if (feedback) setFeedback();
      })
      .catch((e) => setFeedback(e.toString()));
  }

  function assessNft() {
    nft
      .ownerOf(parseInt(input.value))
      .then((data) => {
        if (data !== report.deployer) setFeedback('Not Owned by Fiduciary');
        else {
          setFormValidated(true);
          if (feedback) setFeedback();
        }
      })
      .catch((e) => setFeedback(e.toString()));
  }

  function assess(event) {
    event.preventDefault();
    validating.current = true;
    if (input.assetType === 'gas') assessGas();
    else if (input.assetType === 'ERC20') assessTkn();
    else if (input.assetType === 'ERC721') assessNft();
    validating.current = false;
  }

  return (
    <div>
      <div>
        <h6>Balance</h6>
        Fiduciary: {report.deployer}
        {deployerBalance.isLoading ? (
          <div>Fetching Balance...</div>
        ) : deployerBalance.isError ? (
          <div>Error fetching balance</div>
        ) : (
          <div>
            Balance: {deployerBalance.data?.formatted}{' '}
            {deployerBalance.data?.symbol}
          </div>
        )}
      </div>
      <hr />
      <div>
        <h6>Cash Out</h6>
        <InputGroup>
          <SelectNetwork form="Cashout-On" onClick={selectNetwork} />
          <InputGroup.Text name="network">{selected().network}</InputGroup.Text>

          <DropdownButton title="Asset Type">
            <Dropdown.Item name="gas" onClick={selectAssetType}>
              Native Token (Gas)
            </Dropdown.Item>
            <Dropdown.Item name="ERC20" onClick={selectAssetType}>
              ERC20
            </Dropdown.Item>
            <Dropdown.Item name="ERC721" onClick={selectAssetType}>
              ERC721
            </Dropdown.Item>
          </DropdownButton>

          <InputGroup.Text>
            {selected().assetType !== 'gas'
              ? selected().assetType
              : 'Native Token (Gas)'}
          </InputGroup.Text>

          {!signature ? (
            <Authorize />
          ) : formValidated ? (
            <Button
              onClick={execute}
              disabled={validating.current}
              variant="success"
            >
              Execute
            </Button>
          ) : (
            <Button
              disabled={!proper() || validating.current}
              onClick={assess}
              variant="warning"
            >
              Assess
            </Button>
          )}
        </InputGroup>
        <br />

        {input && (
          <CashoutContext.Provider
            value={{
              validating,
              proper,
              input,
              setAddress,
              setValue,
              formValidated,
              setFormValidated,
              provider,
              feedback,
              setFeedback,
            }}
          >
            <div>{feedback}</div>
            {!signature ? (
              <div />
            ) : selected().assetType === 'gas' ? (
              <GasForm />
            ) : selected().assetType === 'ERC20' ? (
              <TokenForm />
            ) : (
              <NftForm />
            )}
          </CashoutContext.Provider>
        )}
      </div>
    </div>
  );
}
