import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';


const GRAPHQL_URL = process.env.GRAPHQL_URL as string || 'http://localhost:4000/';
const REDIRECT_URL = process.env.REDIRECT_URL as string || 'http://localhost:5173/';

interface CustomError extends Error {
  status?: number;
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/hello', async (req: Request, res: Response) => {
  const { utm_source, linkId } = req.query;

  console.log("Received UTM Source:", utm_source);
  console.log("Received Link ID:", linkId);

  const query = `mutation AddClick($input: ClickInput!) {
    addClick(input: $input) {
      id
    }
  }`;
  const variables = {
    input: {
      linkId: `${ linkId }`,
      ipAddress: "127.0.0.1"
    }
  }
  
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer derp'
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log(await response.json());
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
  
  res.redirect(REDIRECT_URL);
});

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Not Found', status: 404 } });
});

export default app;
