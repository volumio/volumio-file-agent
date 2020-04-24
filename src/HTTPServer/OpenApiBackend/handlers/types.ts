/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express'
import { Context } from 'openapi-backend'

export type Handler<
  Params extends ParamsDictionary,
  Query extends QueryDictionary,
  Body extends any,
  Output extends ResponseDescription<number, any>
> = (c: Context, request: Request<Params, any, Body, Query>) => Promise<Output>

export type ResponseDescription<Status extends number, T extends any> = {
  status: Status
  body: T
}

export interface ParamsDictionary {
  [key: string]: string
}
export interface QueryDictionary {
  [key: string]: string | QueryDictionary | Array<string | QueryDictionary>
}

// export type HandlerResponse<T> = T extends Handler<
//   ParamsDictionary,
//   QueryDictionary,
//   any,
//   infer Output
// >
//   ? CombineObjects<
//       Output,
//       {
//         type: 'response'
//       }
//     >
//   : never
