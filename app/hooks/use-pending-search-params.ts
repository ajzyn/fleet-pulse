import { useNavigation, useSearchParams } from "react-router";

export function usePendingSearchParams() {
  const [current] = useSearchParams();
  const navigation = useNavigation();
  return navigation.location ? new URLSearchParams(navigation.location.search) : current;
}
