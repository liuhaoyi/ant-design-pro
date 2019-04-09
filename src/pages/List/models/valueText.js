import { queryValueText } from '@/services/api';

export default {
  namespace: 'valueText',

  state: {
    valueTextlist: [{}],
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(queryValueText, payload);
      yield put({
        type: 'save',
        payload: response,
      });
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        valueTextlist: action.payload,
      };
    },
  },
};
