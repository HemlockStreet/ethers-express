import { Form } from 'react-bootstrap';

export function UintForm(props) {
  const { onChange, disabled } = props;

  return (
    <Form.Control
      disabled={disabled}
      name="value"
      aria-label="Amount"
      type="number"
      placeholder="0.05"
      min="0.000000000000000001"
      onChange={(event) => {
        let value, ex;
        if (event.target.value > 0) {
          value = event.target.value.toString();

          if (Math.abs(value) < 1.0) {
            ex = parseInt(value.toString().split('e-')[1]);
            if (ex) {
              value *= Math.pow(10, ex - 1);
              value =
                '0.' + new Array(ex).join('0') + value.toString().substring(2);
            }
          } else {
            ex = parseInt(value.toString().split('+')[1]);
            if (ex > 20) {
              ex -= 20;
              value /= Math.pow(10, ex);
              value += new Array(ex + 1).join('0');
            }
          }

          onChange(value);
        }
      }}
    />
  );
}
