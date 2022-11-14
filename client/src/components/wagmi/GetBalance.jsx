import { useBalance } from 'wagmi';

export function GetBalance(props) {
  const { addressOrName, watch } = props;
  const { data, isError, isLoading } = useBalance({
    addressOrName,
    watch,
    formatUnits: 'ether',
  });

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;
  return (
    <div>
      Balance: {data?.formatted} {data?.symbol}
    </div>
  );
}
