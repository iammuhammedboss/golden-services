






import { ScheduleEntry, User as PrismaUser, ScheduleEntryAssignee, Client as PrismaClient, Quotation } from '@prisma/client';







export interface ScheduleEvent {



  id: string;



  title: string;



  start: Date;



  end: Date;



  resource: ScheduleEntry & {



    assignees: (ScheduleEntryAssignee & {



      employee: PrismaUser;



    })[];



  };



}







export interface ScheduleClient {



    id: string;



    name: string;



}







export interface User extends PrismaUser {



}







export interface QuotationWithClient extends Quotation {



    client: {



        name: string;



    };



}




