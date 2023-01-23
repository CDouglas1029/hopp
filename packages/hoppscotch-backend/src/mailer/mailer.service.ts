import { Injectable, OnModuleInit } from '@nestjs/common';
import { Email } from 'src/types/Email';
import {
  MailDescription,
  UserMagicLinkMailDescription,
} from './MailDescriptions';
import * as postmark from 'postmark';
import { throwErr } from 'src/utils';
import * as TE from 'fp-ts/TaskEither';
import { EMAIL_FAILED } from 'src/errors';

@Injectable()
export class MailerService implements OnModuleInit {
  client: postmark.ServerClient;

  onModuleInit() {
    this.client = new postmark.ServerClient(
      process.env.POSTMARK_SERVER_TOKEN ||
        throwErr('No Postmark Server Token defined'),
    );
  }

  sendMail(
    to: string,
    mailDesc: MailDescription | UserMagicLinkMailDescription,
  ) {
    return TE.tryCatch(
      () =>
        this.client.sendEmailWithTemplate({
          To: to,
          From:
            process.env.POSTMARK_SENDER_EMAIL ||
            throwErr('No Postmark Sender Email defined'),
          TemplateAlias: mailDesc.template,
          TemplateModel: mailDesc.variables,
        }),
      () => EMAIL_FAILED,
    );
  }

  /**
   *
   * @param {string} to Receiver's email id
   * @param {UserMagicLinkMailDescription} mailDesc Details of email to be sent for Magic-Link auth
   * @returns {Promise<postmark.Models.MessageSendingResponse>} Response if email was send successfully or not
   */
  async sendAuthEmail(to: string, mailDesc: UserMagicLinkMailDescription) {
    try {
      const res = await this.client.sendEmailWithTemplate({
        To: to,
        From:
          process.env.POSTMARK_SENDER_EMAIL ||
          throwErr('No Postmark Sender Email defined'),
        TemplateAlias: mailDesc.template,
        TemplateModel: mailDesc.variables,
      });
      return res;
    } catch (error) {
      return throwErr(EMAIL_FAILED);
    }
  }
}
