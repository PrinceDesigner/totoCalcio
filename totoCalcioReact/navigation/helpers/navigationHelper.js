// helpers/navigationHelper.js
let globalDispatch = null;
let globalNavigation = null;

export const setGlobalDispatch = (dispatch) => {
  globalDispatch = dispatch;
};

export const setGlobalNavigation = (navigation) => {
  globalNavigation = navigation;
};

export const navigate = (name, params) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  };

export const getGlobalDispatch = () => globalDispatch;
export const getGlobalNavigation = () => globalNavigation;
