import * as React from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useDebounce } from 'use-debounce';
import {
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from 'wagmi';
import { parseEther } from 'ethers/lib/utils';
import { Web3Context } from '../../App';

export function SendGasForm(props) {
  const { network } = React.useContext(Web3Context);
  const { to } = props;

  const [amount, setAmount] = React.useState('0');
  const [debouncedAmount] = useDebounce(amount, 500);

  const { config } = usePrepareSendTransaction({
    request: {
      to,
      value: debouncedAmount ? parseEther(debouncedAmount) : undefined,
    },
  });
  const { data, sendTransaction } = useSendTransaction(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <InputGroup>
      <InputGroup.Text>Amount</InputGroup.Text>
      <Form.Control
        name="value"
        aria-label="Amount (ether)"
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

            if (val !== amount) setAmount(val);
          }
        }}
      />
      <InputGroup.Text>{network.chain.nativeCurrency.symbol}</InputGroup.Text>
      <Button
        disabled={amount === '0' || isLoading || !sendTransaction}
        onClick={(e) => {
          e.preventDefault();
          sendTransaction?.();
        }}
      >
        Send
      </Button>
    </InputGroup>
  );
}
