import express, { Application, Request, Response } from 'express';
import satori, { SatoriOptions } from 'satori';
import fs from 'fs/promises';
import React from 'react';
import { validateRequest } from 'zod-express-middleware';
import { z } from 'zod';
import svg2img from 'svg2img';
import { Project, Token } from './types';

const app = express();
const port = process.env.PORT || 3033;
app.use(express.json());

const formatDate = (date: Date) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year}`;
};

const getSatoriOptions = async () => {
  const regular = await fs.readFile('./fonts/Inter-Regular.woff');
  const medium = await fs.readFile('./fonts/Inter-Medium.woff');
  const semibold = await fs.readFile('./fonts/Inter-SemiBold.woff');
  const bold = await fs.readFile('./fonts/Inter-Bold.woff');
  const extrabold = await fs.readFile('./fonts/Inter-ExtraBold.woff');
  const black = await fs.readFile('./fonts/Inter-Black.woff');

  const options: SatoriOptions = {
    width: 512,
    height: 430,
    fonts: [
      {
        name: 'Inter',
        data: regular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: medium,
        weight: 500,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: semibold,
        weight: 600,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: bold,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: extrabold,
        weight: 800,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: black,
        weight: 900,
        style: 'normal',
      },
    ],
  };

  return options;
};

const Arrow = ({
  direction,
  style,
}: {
  direction: 'up' | 'down';
  style?: React.CSSProperties;
}) => (
  <svg
    width="16"
    height="23"
    viewBox="0 0 17 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transform: direction === 'down' ? 'rotate(180deg)' : 'rotate(0deg)',
      ...style,
    }}
  >
    <path
      d="M15.125 8.5625L8.5625 2L2 8.5625"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.5625 2V23"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const tokensMapping: Record<string, Token> = {
  FNZ: {
    price: {
      usd: 0.003425,
      ton: 0.001433,
    },
    delta: -4.52,
    logoUrl:
      'https://api.redoubt.online/v1/jettons/image/EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86',
    symbol: 'FNZ',
    chartUrl:
      'https://charts.redoubt.online/656da184-70b5-4af4-8db1-775ddc49969d_usd.svg',
  },
  GLINT: {
    price: {
      ton: 0.06631,
      usd: 0.1585,
    },
    delta: -7.59,
    logoUrl:
      'https://api.redoubt.online/v1/jettons/image/EQCBdxpECfEPH2wUxi1a6QiOkSf-5qDjUWqLCUuKtD-GLINT',
    symbol: 'GLINT',
    chartUrl:
      'https://charts.redoubt.online/44c3ae89-4aa0-4bfb-b048-06d4a770785e_usd.svg',
  },
  PUNK: {
    price: {
      ton: 0.2208,
      usd: 0.5278,
    },
    delta: 0.73,
    logoUrl:
      'https://api.redoubt.online/v1/jettons/image/EQCdpz6QhJtDtm2s9-krV2ygl45Pwl-KJJCV1-XrP-Xuuxoq',
    symbol: 'PUNK',
    chartUrl:
      'https://charts.redoubt.online/fd6a3803-dc0f-4b10-85dc-178307243408_usd.svg',
  },
};

const projectsMapping: Record<string, Project> = {
  Tonstakers: {
    name: 'Tonstakers',
    logoUrl: 'https://redoubt.online/share/tondata/icons/tonstakers.svg',
    uaw: 1109,
    uawDelta: 24.47,
    chartUrl: 'https://charts.redoubt.online/tracker/tonstakers_w.svg',
  },
  'Ston.fi': {
    name: 'Ston.fi',
    logoUrl: 'https://redoubt.online/share/tondata/icons/ston.fi.png',
    uaw: 2683,
    uawDelta: 43.02,
    chartUrl: 'https://charts.redoubt.online/tracker/ston.fi_w.svg',
  },
  'Storm Trade': {
    name: 'Storm Trade',
    logoUrl: 'https://redoubt.online/share/tondata/icons/storm.png',
    uaw: 144,
    uawDelta: 21.01,
    chartUrl: 'https://charts.redoubt.online/tracker/storm_w.svg',
  },
};

const jettonSchema = z.object({
  price: z.object({
    ton: z.number(),
    usd: z.number(),
  }),
  delta: z.number(),
  logoUrl: z.string(),
  symbol: z.string(),
  chartUrl: z.string(),
});

const trackerSchema = z.object({
  name: z.string(),
  logoUrl: z.string(),
  uaw: z.number(),
  uawDelta: z.number(),
  chartUrl: z.string(),
});

app.get(
  '/sticker/jetton',
  validateRequest({ body: jettonSchema }),
  async (req: Request, res: Response) => {
    const satoriOptions = await getSatoriOptions();
    const jetton = req.body as Token;
    const imageType = req.query.image_type;

    const card = (
      <div
        style={{
          padding: '10px 0px',
          display: 'flex',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgb(17 24 39)',
            borderRadius: '40px',
            overflow: 'hidden',
            height: '410px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '28px 28px 0px 28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src={jetton.logoUrl}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    fontSize: '26px',
                    display: 'flex',
                    fontWeight: '600',
                  }}
                >
                  {jetton.symbol}
                </div>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgb(209 213 219)',
                  fontWeight: '500',
                }}
              >
                {formatDate(new Date())}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '56px',
                  fontWeight: '800',
                  lineHeight: '1',
                }}
              >
                ${jetton.price.usd}
              </div>
              <div
                style={{
                  color: '#f3f4f6',
                  fontSize: '32px',
                  lineHeight: '1',
                  fontWeight: '500',
                  display: 'flex',
                  marginBottom: '2px',
                }}
              >
                {jetton.price.ton} TON
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: jetton.delta > 0 ? '#48DE80' : 'rgb(244, 63, 94)',
                }}
              >
                <Arrow
                  direction={jetton.delta > 0 ? 'up' : 'down'}
                  style={{ marginBottom: '2px' }}
                />
                <div
                  style={{
                    fontSize: '30px',
                    lineHeight: '1',
                    fontWeight: '500',
                    display: 'flex',
                  }}
                >
                  {Math.abs(jetton.delta)}%
                </div>
              </div>
            </div>
          </div>
          <img style={{ paddingBottom: '70px' }} src={jetton.chartUrl} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#6b7280',
            fontSize: '26px',
            fontWeight: '500',
          }}
        >
          made by re:doubt
        </div>
      </div>
    );

    const svg = await satori(card, satoriOptions);

    if (imageType === 'svg') {
      return res.send(svg);
    }

    svg2img(svg, { quality: 200 }, (err, buffer) => {
      if (err) {
        throw new Error(err);
      }

      res.send(buffer);
    });
  }
);

app.get(
  '/sticker/tracker',
  validateRequest({ body: trackerSchema }),
  async (req: Request, res: Response) => {
    const satoriOptions = await getSatoriOptions();
    const project = req.body as Project;
    const imageType = req.query.image_type;

    const card = (
      <div
        style={{
          padding: '10px 0px',
          display: 'flex',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgb(17 24 39)',
            borderRadius: '40px',
            overflow: 'hidden',
            height: '410px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '28px 28px 0px 28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src={project.logoUrl}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    fontSize: '26px',
                    display: 'flex',
                    fontWeight: '600',
                  }}
                >
                  {project.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgb(209 213 219)',
                  fontWeight: '500',
                }}
              >
                {formatDate(new Date())}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: '56px',
                    fontWeight: '800',
                    lineHeight: '1',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <span>{project.uaw}</span>
                  <div
                    style={{
                      fontSize: '26px',
                      fontWeight: '500',
                      color: '#d1d5db',
                      lineHeight: '1',
                      transform: 'translateY(-6px)',
                    }}
                  >
                    UAW
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: project.uawDelta > 0 ? '#48DE80' : 'rgb(244, 63, 94)',
                }}
              >
                <Arrow
                  direction={project.uawDelta > 0 ? 'up' : 'down'}
                  style={{ marginBottom: '2px' }}
                />
                <div
                  style={{
                    fontSize: '30px',
                    lineHeight: '1',
                    fontWeight: '500',
                    display: 'flex',
                  }}
                >
                  {Math.abs(project.uawDelta)}%
                </div>
              </div>
            </div>
          </div>
          <img style={{ paddingBottom: '70px' }} src={project.chartUrl} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#6b7280',
            fontSize: '26px',
            fontWeight: '500',
          }}
        >
          made by re:doubt
        </div>
      </div>
    );

    const svg = await satori(card, satoriOptions);

    if (imageType === 'svg') {
      return res.send(svg);
    }

    svg2img(svg, { quality: 200 }, (err, buffer) => {
      if (err) {
        throw new Error(err);
      }

      res.send(buffer);
    });
  }
);

app.get('/jettons', async (req, res) => {
  const tokens = Object.values(tokensMapping);
  res.send(tokens);
});

app.get('/tracker', async (req, res) => {
  const projects = Object.values(projectsMapping);
  res.send(projects);
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
