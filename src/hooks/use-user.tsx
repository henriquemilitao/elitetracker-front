import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api } from '../services/api';

type UserData = {
  avatarUrl: string;
  id: string;
  name: string;
  token: string;
};

type UserContextProps = {
  userData: UserData;
  getUserInfo: (githubCode: string) => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextProps>({} as UserContextProps);

type UserProviderProps = {
  children: ReactNode;
};

export const userLocalStorageKey = `${import.meta.env.VITE_LOCALSTORAGE}:userData`;

export function UserProvider({ children }: UserProviderProps) {
  const [userData, setUserData] = useState<UserData>({} as UserData);

  function putUserData(userData: UserData) {
    setUserData(userData);

    localStorage.setItem(userLocalStorageKey, JSON.stringify(userData));
  }

  async function getUserInfo(githubCode: string) {
    const { data } = await api.get<UserData>('/auth/callback', {
      params: {
        code: githubCode,
      },
    });
    putUserData(data);
  }

  async function loadUserData() {
    const localData = localStorage.getItem(userLocalStorageKey as string);

    if (localData) {
      setUserData(JSON.parse(localData) as UserData);
    }
  }

  function logout() {
    setUserData({} as UserData);

    localStorage.removeItem(userLocalStorageKey as string);
  }

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider value={{ getUserInfo, userData, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }

  return context;
}
