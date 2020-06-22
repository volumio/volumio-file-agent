/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express'
import { Context } from 'openapi-backend'

export type Handler<
  Params extends {},
  Query extends {},
  Body extends any,
  Output extends ResponseDescription<number, any>
> = (c: Context, request: Request<Params, any, Body, Query>) => Promise<Output>

export type ResponseDescription<Status extends number, T extends any> = {
  status: Status
  body: T
}
