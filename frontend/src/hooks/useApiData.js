// Loads one API path and tracks the three states every page has to show: loading, error, data.
// reload() fetches again after an action or a Refresh click; a null path loads nothing.
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client.js';

export function useApiData(path) {
  const [state, setState] = useState({ loading: Boolean(path), error: null, data: null });
  // Numbering the requests stops an older, slower answer overwriting a newer one.
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const requestNumber = ++latestRequest.current;
    // Old data is kept during a reload, so the page does not flash empty.
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const data = await apiRequest(path);
      if (requestNumber === latestRequest.current) setState({ loading: false, error: null, data });
    } catch (error) {
      if (requestNumber === latestRequest.current) setState({ loading: false, error, data: null });
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
