import type {
    Connection,
    ConnectionOptions,
    SnowflakeError
  } from "snowflake-sdk";
  import { createConnection } from "snowflake-sdk";
  
 export const getSnowflakeConnection = (connection: ConnectionOptions): Promise<Connection> => {
    return new Promise((resolve, reject) =>
      createConnection(connection).connect((err: SnowflakeError | undefined, conn: Connection) =>
        err ? reject(err) : resolve(conn)
      )
    );
  };
  