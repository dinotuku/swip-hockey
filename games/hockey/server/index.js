const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(`${__dirname}./../client/build`));

swip(io, {
  cluster: {
    events: {
      update: (cluster) => {
        const blobs = cluster.data.blobs;
        const clients = cluster.clients;

        const updatedBlobs = blobs.map((blob) => {
          const boundaryOffset = blob.size;
          const client = clients.find((c) => isParticleInClient(blob, c));

          let nextPosX = blob.x + blob.speedX;
          let nextPosY = blob.y + blob.speedY;
          let nextSpeedX = blob.speedX;
          let nextSpeedY = blob.speedY;

          if (client) { // update speed and position if collision happens
            if (((blob.speedX < 0) &&
              ((nextPosX - boundaryOffset) < client.transform.x)
              && !isWallOpenAtPosition(client.transform.y, client.openings.left, nextPosY))) {
              nextPosX = client.transform.x + boundaryOffset;
              nextSpeedX = blob.speedX * -1;
            } else if (((blob.speedX > 0) &&
              ((nextPosX + boundaryOffset) > (client.transform.x + client.size.width))
              && !isWallOpenAtPosition(client.transform.y, client.openings.right, nextPosY))) {
              nextPosX = client.transform.x + (client.size.width - boundaryOffset);
              nextSpeedX = blob.speedX * -1;
            }

            if (((blob.speedY < 0) &&
              ((nextPosY - boundaryOffset) < client.transform.y)
              && !isWallOpenAtPosition(client.transform.x, client.openings.top, nextPosX))) {
              nextPosY = client.transform.y + boundaryOffset;
              nextSpeedY = blob.speedY * -1;
            } else if (((blob.speedY > 0) &&
              ((nextPosY + boundaryOffset) > (client.transform.y + client.size.height))
              && !isWallOpenAtPosition(client.transform.x, client.openings.bottom, nextPosX))) {
              nextPosY = client.transform.y + (client.size.height - boundaryOffset);
              nextSpeedY = blob.speedY * -1;
            }
          } else { // reset blob to first client of cluster
            const firstClient = clients[0];
            nextPosX = firstClient.transform.x + (firstClient.size.width / 2);
            nextPosY = firstClient.transform.y + (firstClient.size.height / 2);
            nextSpeedX = 0;
            nextSpeedY = 0;
          }

          blob.x = nextPosX;
          blob.y = nextPosY;
          blob.speedX = nextSpeedX;
          blob.speedY = nextSpeedY;

          return blob;
        });

        return {
          blobs: { $set: updatedBlobs },
        };
      },
      merge: (cluster1, cluster2, transform) => ({
        blobs: { $set: getNewParticleDist(cluster1, cluster2) },
        backgroundColor: { $set: cluster1.data.backgroundColor },
      }),
    },
    init: () => ({ blobs: [], backgroundColor: getRandomColor() }),
  },

  client: {
    init: () => ({}),
    events: {
      addBlobs: ({ cluster, client }, { blobs }) => (
        {
          cluster: {
            data: { blobs: { $push: blobs } },
          },
        }
      ),
      updateBlobs: ({ cluster, client }, { blobs }) => (
        {
          cluster: {
            data: { blobs: { $set: blobs } },
          },
        }
      ),
      gameOver: ({ cluster, client }, { blobs }) => {
        cluster.clients.forEach((cli) => {
          if (cli === client) {
            cli.result = 'lose';
          } else {
            cli.result = 'win';
          }
          return cli;
        });
        return {
          cluster: {
            data: { blobs: { $set: blobs } },
          },
        };
      },
      resetGame: ({ cluster, client }, { blobs }) => {
        cluster.clients.forEach((cli) => {
          cli.result = 'reset';
          return cli;
        });
        return {
          cluster: {
            data: { blobs: { $set: blobs } },
          },
        };
      },
    },
  },
});

function isParticleInClient (particle, client) {
  const leftSide = client.transform.x;
  const rightSide = (client.transform.x + client.size.width);
  const topSide = client.transform.y;
  const bottomSide = (client.transform.y + client.size.height);

  if (particle.x < rightSide && particle.x > leftSide && particle.y > topSide && particle.y < bottomSide) {
    return true;
  }

  return false;
}

function isWallOpenAtPosition (transform, openings, particlePos) {
  return openings.some((opening) => (
    particlePos >= (opening.start + transform) && particlePos <= (opening.end + transform)
  ));
}

function getNewParticleDist (cluster1, cluster2) {
  cluster1.data.blobs = [];
  cluster2.data.blobs = [];
  cluster1.data.blobs.push({
    x: cluster1.clients[0].size.width / 2,
    y: cluster1.clients[0].size.height / 2,
    speedX: 0,
    speedY: 0,
    size: 15,
  });

  return cluster1.data.blobs.concat(cluster2.data.blobs);
}

function getRandomColor () {
  const colors = ['#e8d174', '#e39e54', '#0ea7b5', '#4d7358', '#91d670'];
  return colors[Math.floor(Math.random() * colors.length)];
}

server.listen(3000);

// eslint-disable-next-line no-console
console.log('started server: http://localhost:3000');
