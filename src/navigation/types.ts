import { NavigatorScreenParams } from '@react-navigation/native';
import { Contact } from '../types';

export type OnboardingStackParamList = {
  Welcome: undefined;
  UserInfo: undefined;
  SimSelection: undefined;
  BankSelection: undefined;
  UssdVerification: undefined;
  PinSetup: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  SendMoney: { mode?: 'pay' | 'request'; qrData?: string; receiver?: Contact } | undefined;
  ConfirmPayment: { amount: number; receiver: Contact; note?: string };
  UpiPin: { amount: number; receiver: Contact; note?: string };
  PaymentResult: { success: boolean; amount: number; receiver: Contact; refId: string; error?: string };
  ExpenseTracker: undefined;
  AccountServices: undefined;
  NotificationCenter: undefined;
};

export type HistoryStackParamList = {
  TransactionHistory: undefined;
  TransactionDetails: { transactionId: string };
};

export type ProfileStackParamList = {
  Settings: undefined;
  Profile: undefined;
  SecurityCenter: undefined;
  Contacts: undefined;
  ContactProfile: { contact: Contact };
  MerchantDashboard: undefined;
  MerchantQR: undefined;
  WidgetSettings: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ScanTab: undefined;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Lock: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
