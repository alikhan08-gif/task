import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CreateTask: { taskId?: string } | undefined;
  Friends: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Weekly: undefined;
  Profile: undefined;
};

export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
