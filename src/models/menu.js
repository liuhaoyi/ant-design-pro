import memoizeOne from 'memoize-one';
import isEqual from 'lodash/isEqual';
import { formatMessage } from 'umi-plugin-react/locale';
import Authorized from '@/utils/Authorized';
// liuhaoyi 注释掉，程序中未使用到；
// import { menu } from '../defaultSettings';
import { queryMenus } from '@/services/api';

const { check } = Authorized;
// @liuhaoyi 注释掉；
// // Conversion router to menu.
// function formatter(data, parentAuthority, parentName) {
//   if (!data) {
//     return undefined;
//   }
//   return data
//     .map(item => {
//       if (!item.name || !item.path) {
//         return null;
//       }

//       let locale = 'menu';
//       if (parentName && parentName !== '/') {
//         locale = `${parentName}.${item.name}`;
//       } else {
//         locale = `menu.${item.name}`;
//       }
//       // if enableMenuLocale use item.name,
//       // close menu international
//       const name = menu.disableLocal
//         ? item.name
//         : formatMessage({ id: locale, defaultMessage: item.name });
//       const result = {
//         ...item,
//         name,
//         locale,
//         authority: item.authority || parentAuthority,
//       };
//       if (item.routes) {
//         const children = formatter(item.routes, item.authority, locale);
//         // Reduce memory usage
//         result.children = children;
//       }
//       delete result.routes;
//       return result;
//     })
//     .filter(item => item);
// }

// const memoizeOneFormatter = memoizeOne(formatter, isEqual);

/**
 * get SubMenu or Item
 */
const getSubMenu = item => {
  // doc: add hideChildrenInMenu
  if (item.children && !item.hideChildrenInMenu && item.children.some(child => child.name)) {
    return {
      ...item,
      children: filterMenuData(item.children), // eslint-disable-line
    };
  }
  return item;
};

/**
 * filter menuData
 */
const filterMenuData = menuData => {
  if (!menuData) {
    return [];
  }
  return menuData
    .filter(item => item.name && !item.hideInMenu)
    .map(item => check(item.authority, getSubMenu(item)))
    .filter(item => item);
};
/**
 * 获取面包屑映射
 * @param {Object} menuData 菜单配置
 */
const getBreadcrumbNameMap = menuData => {
  if (!menuData) {
    return {};
  }
  const routerMap = {};

  const flattenMenuData = data => {
    data.forEach(menuItem => {
      if (menuItem.children) {
        flattenMenuData(menuItem.children);
      }
      // Reduce memory usage
      routerMap[menuItem.path] = menuItem;
    });
  };
  flattenMenuData(menuData);
  return routerMap;
};

const memoizeOneGetBreadcrumbNameMap = memoizeOne(getBreadcrumbNameMap, isEqual);

export default {
  namespace: 'menu',

  state: {
    menuData: [],
    routerData: [],
    breadcrumbNameMap: {},
  },

  effects: {
    *getMenuData({ payload }, { call, put }) {
      // const { routes, authority, path } = payload;
      const { routes } = payload;

      // 读取服务端，获取Menu数据；@liuhaoyi
      const response = yield call(queryMenus);
      // Login successfully
      if (response.status === 'ok') {
        const originalMenuData = response.data;
        // 递归函数，遍历菜单数据，并且支持多语言。
        const localeMenuData = data => {
          const myData = [...data];
          const newData = myData.map(item => {
            let myItem = { ...item };
            if (item.locale) {
              myItem = {
                ...item,
                name: formatMessage({ id: item.locale, defaultMessage: item.name }),
              };
            }
            if (item.children) {
              myItem = { ...myItem, children: localeMenuData(item.children) };
            }
            return myItem;
          });
          return newData;
        };
        const myOriginalMenuData = localeMenuData(originalMenuData);

        // 注释掉原有的在router.config.js中获取菜单的功能。
        // const originalMenuData = memoizeOneFormatter(routes, authority, path);
        const menuData = filterMenuData(myOriginalMenuData);
        const breadcrumbNameMap = memoizeOneGetBreadcrumbNameMap(myOriginalMenuData);
        yield put({
          type: 'save',
          payload: { menuData, breadcrumbNameMap, routerData: routes },
        });
      }
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
};
