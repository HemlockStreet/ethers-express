import * as React from 'react';

export default function ObjectDisplay(props) {
  const entity = props.entity;
  const keys = Object.keys(entity);

  return (
    <ul>
      {keys.map((key) => {
        return (
          <li key={key}>
            {key}:{' '}
            {entity[key] === undefined ? (
              ''
            ) : typeof entity[key] === 'object' ? (
              <ObjectDisplay entity={entity[key]} />
            ) : typeof entity[key] === 'boolean' ? (
              entity[key].toString()
            ) : (
              entity[key]
            )}
          </li>
        );
      })}
    </ul>
  );
}
