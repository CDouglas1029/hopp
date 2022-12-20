import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PubSubService } from 'src/pubsub/pubsub.service';
import { User } from 'src/user/user.model';
import * as E from 'fp-ts/Either';
import { stringToJson } from 'src/utils';
import { UserSettings } from './user-settings.model';
import {
  USER_NOT_FOUND,
  USER_SETTINGS_INVALID_PROPERTIES,
  USER_SETTINGS_NOT_FOUND,
  USER_SETTINGS_UPDATE_FAILED,
} from 'src/errors';

@Injectable()
export class UserSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pubsub: PubSubService,
  ) {}

  async fetchUserSettings(user: User) {
    try {
      const dbUserSettings = await this.prisma.userSettings.findUnique({
        where: { userUid: user.uid },
        rejectOnNotFound: true,
      });

      const userSettings: UserSettings = {
        id: dbUserSettings.id,
        userUid: dbUserSettings.userUid,
        properties: JSON.stringify(dbUserSettings.properties),
        updatedOn: dbUserSettings.updatedOn,
      };

      return E.right(userSettings);
    } catch (e) {
      return E.left(USER_SETTINGS_NOT_FOUND);
    }
  }

  async createUserSettings(user: User, properties: string) {
    if (!properties) return E.left(USER_SETTINGS_INVALID_PROPERTIES);

    const jsonProperties = stringToJson(properties);
    if (E.isLeft(jsonProperties)) return E.left(jsonProperties.left);

    try {
      const dbUserSettings = await this.prisma.userSettings.create({
        data: {
          properties: jsonProperties.right,
          userUid: user.uid,
        },
      });

      const userSettings: UserSettings = {
        id: dbUserSettings.id,
        userUid: dbUserSettings.userUid,
        properties,
        updatedOn: dbUserSettings.updatedOn,
      };

      return E.right(userSettings);
    } catch (e) {
      return E.left(USER_NOT_FOUND);
    }
  }

  async updateUserSettings(user: User, properties: string) {
    if (!properties) return E.left(USER_SETTINGS_INVALID_PROPERTIES);

    const jsonProperties = stringToJson(properties);
    if (E.isLeft(jsonProperties)) return E.left(jsonProperties.left);

    try {
      const dbUpdatedUserSettings = await this.prisma.userSettings.update({
        where: { userUid: user.uid },
        data: {
          properties: jsonProperties.right,
        },
      });

      const updatedUserSettings: UserSettings = {
        id: dbUpdatedUserSettings.id,
        userUid: dbUpdatedUserSettings.userUid,
        properties,
        updatedOn: dbUpdatedUserSettings.updatedOn,
      };

      // Publish subscription for environment creation
      await this.pubsub.publish(
        `user_settings/${user.uid}/updated`,
        updatedUserSettings,
      );

      return E.right(updatedUserSettings);
    } catch (e) {
      return E.left(USER_SETTINGS_UPDATE_FAILED);
    }
  }
}
