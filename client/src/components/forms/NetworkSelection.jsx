import { useContext } from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { ApiContext } from '../../App';

export default function SelectNetwork(props) {
  const { form, onClick } = props;
  const { report } = useContext(ApiContext);

  return (
    <DropdownButton title="Network">
      {report.networks.map((name) => (
        <Dropdown.Item key={`${form}-${name}`} name={name} onClick={onClick}>
          {name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
}
