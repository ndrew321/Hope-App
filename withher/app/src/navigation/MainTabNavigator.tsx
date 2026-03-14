import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type {
  MainTabParamList,
  DiscoverStackParamList,
  MatchesStackParamList,
  MessagesStackParamList,
  CommunityStackParamList,
  ProfileStackParamList,
} from '../types';
import { Colors } from '../constants/theme';

// Discover
import DiscoverFeedScreen from '../screens/discover/DiscoverFeedScreen';
import ProfileViewScreen from '../screens/discover/ProfileViewScreen';

// Matches
import MatchListScreen from '../screens/matches/MatchListScreen';
import ProgramDetailScreen from '../screens/matches/ProgramDetailScreen';
import SessionDetailScreen from '../screens/matches/SessionDetailScreen';

// Messages
import ConversationListScreen from '../screens/messages/ConversationListScreen';
import ChatScreen from '../screens/messages/ChatScreen';

// Community
import ForumScreen from '../screens/community/ForumScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import CreatePostScreen from '../screens/community/CreatePostScreen';
import EventListScreen from '../screens/community/EventListScreen';
import EventDetailScreen from '../screens/community/EventDetailScreen';
import ResourceListScreen from '../screens/community/ResourceListScreen';
import ResourceDetailScreen from '../screens/community/ResourceDetailScreen';

// Profile
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import BadgesScreen from '../screens/profile/BadgesScreen';
import LeaderboardScreen from '../screens/profile/LeaderboardScreen';
import SafetyScreen from '../screens/profile/SafetyScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function DiscoverStack(): React.JSX.Element {
  const Stack = createNativeStackNavigator<DiscoverStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverFeed" component={DiscoverFeedScreen} />
      <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
    </Stack.Navigator>
  );
}

function MatchesStack(): React.JSX.Element {
  const Stack = createNativeStackNavigator<MatchesStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MatchList" component={MatchListScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

function MessagesStack(): React.JSX.Element {
  const Stack = createNativeStackNavigator<MessagesStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationList" component={ConversationListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function CommunityStack(): React.JSX.Element {
  const Stack = createNativeStackNavigator<CommunityStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="EventList" component={EventListScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="ResourceList" component={ResourceListScreen} />
      <Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack(): React.JSX.Element {
  const Stack = createNativeStackNavigator<ProfileStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Badges" component={BadgesScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
    </Stack.Navigator>
  );
}

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, [TabIconName, TabIconName]> = {
  Discover: ['compass', 'compass-outline'],
  Matches: ['heart', 'heart-outline'],
  Messages: ['chatbubbles', 'chatbubbles-outline'],
  Community: ['people', 'people-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondaryLight,
        tabBarStyle: {
          backgroundColor: Colors.surfaceLight,
          borderTopColor: Colors.borderLight,
          paddingBottom: 6,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [activeIcon, inactiveIcon] = TAB_ICONS[route.name as keyof MainTabParamList];
          return <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Community" component={CommunityStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
