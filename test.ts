import type {
    Binds,
    Connection,
    ConnectionOptions,
    RowStatement,
    SnowflakeError
  } from "snowflake-sdk";
  import { createConnection } from "snowflake-sdk";
  
  export interface ISnowflakeConfig {
    snowflakeSource: string;
    postfix: string;
  }
  
  const getSnowflakeConnection = (connection: ConnectionOptions): Promise<Connection> => {
    return new Promise((resolve, reject) =>
      createConnection(connection).connect((err: SnowflakeError | undefined, conn: Connection) =>
        err ? reject(err) : resolve(conn)
      )
    );
  };
  
  export const runGenericSnowflakeQuery = async <T>({
    query,
    params,
    snowflakeConnection,
    getSnowflakeConfig
  }: {
    query: string;
    snowflakeConnection: any;
    params?: Binds;
    getSnowflakeConfig: () => Promise<ISnowflakeConfig>;
  }): Promise<T[]> => {
    return new Promise((resolve, reject) =>
      snowflakeConnection.execute({
        sqlText: query,
        binds: params,
        complete: (err: SnowflakeError | undefined, stmt: RowStatement, rows: T[] | undefined) =>
          err ? reject(err) : resolve(rows || [])
      })
    );
  };
  