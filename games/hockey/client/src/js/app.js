import io from 'socket.io-client';
import $ from 'jquery';
import 'jquery-ui/ui/effect';
import '../css/app.css';

const socket = io.connect();

let page = 0;

$('.nextBtn').click(() => {
  if (page === 0) {
    $('.gameInstructions').animate({ left: ['-100%', 'easeInOutQuad'] });
    $('.prevBtn').show();
    page += 1;
  } else if (page === 1) {
    $('.gameInstructions').animate({ left: ['-200%', 'easeInOutQuad'] }, () => {
      $('.thirdInstruction .rightScreen').animate({
        backgroundColor: ['rgba(173, 216, 230, 1)', 'easeInOutQuad'],
      }, () => { $('.ball').fadeIn(); });
    });
    $('.nextBtn').html('Start');
    page += 1;
  } else {
    $('.gameStart').animate({ left: ['-100%', 'easeInOutQuad'] });
  }
});

$('.prevBtn').click(() => {
  if (page === 1) {
    $('.gameInstructions').animate({ left: ['0', 'easeInOutQuad'] });
    $('.prevBtn').hide();
    page -= 1;
  } else {
    $('.gameInstructions').animate({ left: ['-100%', 'easeInOutQuad'] }, () => {
      $('.thirdInstruction .rightScreen').css('backgroundColor', 'rgba(240, 128, 128, 1)');
      $('.ball').hide();
    });
    $('.nextBtn').html('Next');
    page -= 1;
  }
});

function drawBackground(ctx, evt) {
  ctx.save();

  ctx.fillStyle = evt.cluster.data.backgroundColor;
  ctx.fillRect(evt.client.transform.x, evt.client.transform.y,
    evt.client.size.width, evt.client.size.height);

  ctx.restore();
}

function applyTransform(ctx, converter, transform) {
  ctx.translate(-converter.toDevicePixel(transform.x), -converter.toDevicePixel(transform.y));
  ctx.scale(converter.toDevicePixel(1), converter.toDevicePixel(1));
}

function drawBlobs(ctx, strikers, clickedStrikers, updatedBlobs) {
  ctx.shadowBlur = 0;

  ctx.save();

  strikers.forEach((blob) => {
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.size / 2.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#000000';
    ctx.fill();
  });

  clickedStrikers.forEach((blob) => {
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.size / 2.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#000000';
    ctx.fill();
  });

  updatedBlobs.forEach((blob) => {
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  });

  ctx.restore();
}

function touchInRadius(posX, posY, blobX, blobY, blobsSize) {
  let inRadius = false;

  if ((posX < (blobX + blobsSize) && posX > (blobX - blobsSize)) &&
    (posY < (blobY + blobsSize) && posY > (blobY - blobsSize))) {
    inRadius = true;
  }

  return inRadius;
}

function drawOpenings(ctx, client) {
  const openings = client.openings;
  const transformX = client.transform.x;
  const transformY = client.transform.y;
  const width = client.size.width;
  const height = client.size.height;
  const tmpGoal = {};

  ctx.lineWidth = 5;
  ctx.shadowBlur = 5;

  openings.left.forEach((wall) => {
    ctx.strokeStyle = '#ff9e00';
    ctx.shadowColor = '#ff9e00';

    ctx.beginPath();
    ctx.moveTo(transformX, wall.start + transformY);
    ctx.lineTo(transformX, wall.end + transformY);
    ctx.stroke();

    const goalCenter = (wall.start + wall.end) / 2;
    ctx.strokeStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.moveTo(width + transformX, (goalCenter - 75) + transformY);
    ctx.lineTo(width + transformX, (goalCenter + 75) + transformY);
    ctx.stroke();
    tmpGoal.orientation = 'right';
    tmpGoal.start = goalCenter - 75;
    tmpGoal.end = goalCenter + 75;
  });

  openings.top.forEach((wall) => {
    ctx.strokeStyle = '#0084FF';
    ctx.shadowColor = '#0084FF';

    ctx.beginPath();
    ctx.moveTo(wall.start + transformX, transformY);
    ctx.lineTo(wall.end + transformX, transformY);
    ctx.stroke();

    const goalCenter = (wall.start + wall.end) / 2;
    ctx.strokeStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.moveTo((goalCenter - 75) + transformX, height + transformY);
    ctx.lineTo((goalCenter + 75) + transformX, height + transformY);
    ctx.stroke();
    tmpGoal.orientation = 'bottom';
    tmpGoal.start = goalCenter - 75;
    tmpGoal.end = goalCenter + 75;
  });

  openings.right.forEach((wall) => {
    ctx.strokeStyle = '#0084FF';
    ctx.shadowColor = '#0084FF';

    ctx.beginPath();
    ctx.moveTo(width + transformX, wall.start + transformY);
    ctx.lineTo(width + transformX, wall.end + transformY);
    ctx.stroke();

    const goalCenter = (wall.start + wall.end) / 2;
    ctx.strokeStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.moveTo(transformX, (goalCenter - 75) + transformY);
    ctx.lineTo(transformX, (goalCenter + 75) + transformY);
    ctx.stroke();
    tmpGoal.orientation = 'left';
    tmpGoal.start = goalCenter - 75;
    tmpGoal.end = goalCenter + 75;
  });

  openings.bottom.forEach((wall) => {
    ctx.strokeStyle = '#ff9e00';
    ctx.shadowColor = '#ff9e00';

    ctx.beginPath();
    ctx.moveTo(wall.start + transformX, height + transformY);
    ctx.lineTo(wall.end + transformX, height + transformY);
    ctx.stroke();

    const goalCenter = (wall.start + wall.end) / 2;
    ctx.strokeStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.moveTo((goalCenter - 75) + transformX, transformY);
    ctx.lineTo((goalCenter + 75) + transformX, transformY);
    ctx.stroke();
    tmpGoal.orientation = 'top';
    tmpGoal.start = goalCenter - 75;
    tmpGoal.end = goalCenter + 75;
  });

  return tmpGoal;
}

swip.init({ socket, container: $('.gameCanvas')[0], type: 'canvas' }, (client) => {
  const converter = client.converter;
  const stage = client.stage;
  const ctx = stage.getContext('2d');

  let counter = 0;
  let blobs = [];
  let strikers = [];
  const activeStrikers = [];
  const clickedStrikers = [];
  const disToStriker = [];

  let goalPosition = {
    alignment: '',
    start: null,
    end: null,
  };

  let bool1 = false;
  let bool2 = false;

  client.onDragStart((evt) => {
    evt.position.forEach((pos) => {
      for (let i = 0; i < strikers.length; i++) {
        if (touchInRadius(pos.x, pos.y, strikers[i].x, strikers[i].y, strikers[i].size * 1.2)) {
          clickedStrikers.push(strikers.splice(i, 1)[0]);
          disToStriker.push({
            x: pos.x - clickedStrikers[clickedStrikers.length - 1].x,
            y: pos.y - clickedStrikers[clickedStrikers.length - 1].y,
          });
        }
      }
    });
    if (clickedStrikers.length > 0) {
      client.emit('updateBlobs', { blobs });
    }

    if (clickedStrikers.length === 0 && blobs.length < 2) {
      evt.position.forEach((pos) => {
        activeStrikers.push({
          x: pos.x,
          y: pos.y,
          speedX: 0,
          speedY: 0,
          size: converter.toAbsPixel(20),
        });
      });
    }
  });

  client.onDragMove((evt) => {
    if (clickedStrikers.length > 0) {
      if (counter >= 3) {
        evt.position.forEach((pos) => {
          for (let i = 0; i < clickedStrikers.length; i++) {
            if (touchInRadius(pos.x, pos.y,
              clickedStrikers[i].x, clickedStrikers[i].y, clickedStrikers[i].size * 100000)) {
              clickedStrikers[i].x = pos.x - disToStriker[i].x;
              clickedStrikers[i].y = pos.y - disToStriker[i].y;
            }
            if (blobs[0]) {
              if (touchInRadius(clickedStrikers[i].x, clickedStrikers[i].y,
                blobs[0].x, blobs[0].y, blobs[0].size + clickedStrikers[i].size)) {
                blobs[0].speedX = (blobs[0].x - clickedStrikers[i].x) / 2;
                blobs[0].speedY = (blobs[0].y - clickedStrikers[i].y) / 2;
              }
            }
          }
          client.emit('updateBlobs', { blobs });
        });
        counter = 0;
      }
      counter++;
    } else {
      evt.position.forEach((pos) => {
        for (let i = 0; i < activeStrikers.length; i++) {
          if (touchInRadius(pos.x, pos.y,
            activeStrikers[i].x, activeStrikers[i].y, activeStrikers[i].size)) {
            activeStrikers.splice(i, 1);
            i--;
          }
        }
      });
    }
  });

  client.onDragEnd((evt) => {
    if (clickedStrikers.length === 0) {
      evt.position.forEach((pos) => {
        const emitBlobs = [];
        for (let i = 0; i < activeStrikers.length; i++) {
          if (touchInRadius(pos.x, pos.y,
            activeStrikers[i].x, activeStrikers[i].y, activeStrikers[i].size)) {
            emitBlobs.push(activeStrikers[i]);
            activeStrikers.splice(i, 1);
            i--;
          }
        }
        if (emitBlobs.length) {
          // client.emit('addBlobs', { blobs: emitBlobs });
          strikers = emitBlobs;
        }
      });
    }
  });

  client.onUpdate((evt) => {
    const updatedBlobs = evt.cluster.data.blobs;
    blobs = updatedBlobs;

    if (evt.client.transform.x && strikers.length && !bool1) {
      bool1 = true;
      strikers[0].x += evt.client.transform.x;
    }
    if (evt.client.transform.y && strikers.length && !bool2) {
      bool2 = true;
      strikers[0].y += evt.client.transform.y;
    }

    ctx.save();

    applyTransform(ctx, converter, evt.client.transform);

    drawBackground(ctx, evt);
    goalPosition = drawOpenings(ctx, evt.client);
    drawBlobs(ctx, strikers, clickedStrikers, updatedBlobs);

    ctx.restore();
  });
});
