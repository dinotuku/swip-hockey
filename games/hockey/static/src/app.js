/* eslint-disable */
(function () {
  'use strict';

  var socket = io.connect();

  swip.init({ socket: socket, container: document.getElementById('root'), type: 'canvas' }, function (client) {
    var converter = client.converter;
    var stage = client.stage;
    var ctx = stage.getContext('2d');

    var counter = 0;
    var blobs = [];
    var strikers = [];
    var activeStrikers = [];
    var clickedStrikers = [];
    var disToStriker = [];
    let bool1 = false;
    let bool2 = false;

    client.onDragStart(function (evt) {
      evt.position.forEach(function (pos) {
        for (var i = 0; i < strikers.length; i++) {
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
        client.emit('updateBlobs', { blobs: blobs });
      }

      if (clickedStrikers == false && blobs.length < 2) {
        evt.position.forEach(function (pos) {
          activeStrikers.push({
            x: pos.x,
            y: pos.y,
            speedX: 0,
            speedY: 0,
            size: converter.toAbsPixel(20)
          });
        });
      }
    });

    client.onDragMove(function (evt) {
      if (clickedStrikers.length > 0) {
        if (counter >= 3) {
          evt.position.forEach(function (pos) {
            for (var i = 0; i < clickedStrikers.length; i++) {
              if (touchInRadius(pos.x, pos.y, clickedStrikers[i].x, clickedStrikers[i].y, clickedStrikers[i].size * 10)) {
                clickedStrikers[i].x = pos.x - disToStriker[i].x;
                clickedStrikers[i].y = pos.y - disToStriker[i].y;
              }
              if (blobs[0]) {
                if (touchInRadius(clickedStrikers[i].x, clickedStrikers[i].y, blobs[0].x, blobs[0].y, blobs[0].size + clickedStrikers[i].size)) {
                  blobs[0].speedX = (blobs[0].x - clickedStrikers[i].x) / 2;
                  blobs[0].speedY = (blobs[0].y - clickedStrikers[i].y) / 2;
                }
              }
            }
            client.emit('updateBlobs', { blobs: blobs });
          });
          counter = 0;
        }
        counter++;
      } else {
        evt.position.forEach(function (pos) {
          for (var i = 0; i < activeStrikers.length; i++) {
           if (touchInRadius(pos.x, pos.y, activeStrikers[i].x, activeStrikers[i].y, activeStrikers[i].size)) {
            activeStrikers.splice(i, 1);
            i--;
           }
          }
        });
      }
    });

    client.onDragEnd(function (evt) {
      if (clickedStrikers == false) {
        evt.position.forEach(function (pos) {
          var emitBlobs = [];
          for (var i = 0; i < activeStrikers.length; i++) {
            if (touchInRadius(pos.x, pos.y, activeStrikers[i].x, activeStrikers[i].y, activeStrikers[i].size)) {
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
      // else {
      //   evt.position.forEach(function (pos) {
      //     var emitBlobs = [];
      //     for (var i = 0; i < clickedStrikers.length; i++) {
      //       var startX = clickedStrikers[i].x;
      //       var startY = clickedStrikers[i].y;

      //       if (touchInRadius(pos.x, pos.y, clickedStrikers[i].x, clickedStrikers[i].y, clickedStrikers[i].size * 40)) {
      //         clickedStrikers[i].x = pos.x - disToStriker[i].x;
      //         clickedStrikers[i].y = pos.y - disToStriker[i].y;
      //         clickedStrikers[i].speedX = (clickedStrikers[i].x  - startX) / 2;
      //         clickedStrikers[i].speedY = (clickedStrikers[i].y - startY) / 2;
      //         emitBlobs.push(clickedStrikers.splice(i, 1)[0]);
      //         disToStriker.splice(i, 1);
      //         i--;
      //       }
      //     }
      //     client.emit('addBlobs', { blobs: emitBlobs });
      //   });
      // }
    });

    client.onUpdate(function (evt) {
      var updatedBlobs = evt.cluster.data.blobs;
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
      drawOpenings(ctx, evt.client);
      // increaseActiveBlobSize(activeStrikers, converter);
      drawBlobs(ctx, strikers, clickedStrikers, updatedBlobs);

      ctx.restore();
    });
  });

  function drawBackground (ctx, evt) {
    ctx.save();

    ctx.fillStyle = evt.cluster.data.backgroundColor;
    ctx.fillRect(evt.client.transform.x, evt.client.transform.y, evt.client.size.width, evt.client.size.height);

    ctx.restore();
  }

  function applyTransform (ctx, converter, transform) {
    ctx.translate(-converter.toDevicePixel(transform.x), -converter.toDevicePixel(transform.y));
    ctx.scale(converter.toDevicePixel(1), converter.toDevicePixel(1));
  }

  function increaseActiveBlobSize (activeStrikers, converter) {
    if (activeStrikers) {
      for(var i = 0; i < activeStrikers.length; i++) {
        if (activeStrikers[i].size < converter.toAbsPixel(100)) {
          activeStrikers[i].size += 1;
        }
      }
    }
  }

  function drawBlobs (ctx, strikers, clickedStrikers, updatedBlobs) {
    ctx.shadowBlur = 0;

    ctx.save();

    strikers.forEach(function(blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size / 2.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#000000';
      ctx.fill();
    });

    clickedStrikers.forEach(function(blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size , 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size / 2.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#000000';
      ctx.fill();
    });

    updatedBlobs.forEach(function (blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size , 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });

    ctx.restore();
  }

  function touchInRadius (posX, posY, blobX, blobY, blobsSize) {
    var inRadius = false;

    if ((posX < (blobX + blobsSize) && posX > (blobX - blobsSize)) &&
      (posY < (blobY + blobsSize) && posY > (blobY - blobsSize))) {
      inRadius = true;
    }

    return inRadius;
  }

  function indexInClicked (index, clickedStrikers) {
    for (var i = 0; i < clickedStrikers.length; i++) {
      if (clickedStrikers[i].index == index) {
        return true;
      }
    }
    return false;
  }

  function drawOpenings (ctx, client) {
    var openings = client.openings;
    var transformX = client.transform.x;
    var transformY = client.transform.y;
    var width = client.size.width;
    var height = client.size.height;

    ctx.lineWidth = 5;
    ctx.shadowBlur = 5;

    openings.left.forEach(function (wall) {
      ctx.strokeStyle = "#ff9e00";
      ctx.shadowColor = "#ff9e00";

      ctx.beginPath();
      ctx.moveTo(transformX, wall.start + transformY);
      ctx.lineTo(transformX, wall.end + transformY);
      ctx.stroke();

      let goalCenter = (wall.start + wall.end) / 2;
      ctx.strokeStyle = "#000000";
      ctx.shadowColor = "#000000";
      ctx.beginPath();
      ctx.moveTo(width + transformX, goalCenter - 75 + transformY);
      ctx.lineTo(width + transformX, goalCenter + 75 + transformY);
      ctx.stroke();
    });

    openings.top.forEach(function (wall) {
      ctx.strokeStyle = "#0084FF";
      ctx.shadowColor = "#0084FF";

      ctx.beginPath();
      ctx.moveTo(wall.start + transformX, transformY);
      ctx.lineTo(wall.end + transformX, transformY);
      ctx.stroke();

      let goalCenter = (wall.start + wall.end) / 2;
      ctx.strokeStyle = "#000000";
      ctx.shadowColor = "#000000";
      ctx.beginPath();
      ctx.moveTo(goalCenter - 75 + transformX, height + transformY);
      ctx.lineTo(goalCenter + 75 + transformX, height + transformY);
      ctx.stroke();
    });

    openings.right.forEach(function (wall) {
      ctx.strokeStyle = "#0084FF";
      ctx.shadowColor = "#0084FF";

      ctx.beginPath();
      ctx.moveTo(width + transformX, wall.start + transformY);
      ctx.lineTo(width + transformX, wall.end + transformY);
      ctx.stroke();

      let goalCenter = (wall.start + wall.end) / 2;
      ctx.strokeStyle = "#000000";
      ctx.shadowColor = "#000000";
      ctx.beginPath();
      ctx.moveTo(transformX, goalCenter - 75 + transformY);
      ctx.lineTo(transformX, goalCenter + 75 + transformY);
      ctx.stroke();
    });

    openings.bottom.forEach(function (wall) {
      ctx.strokeStyle = "#ff9e00";
      ctx.shadowColor = "#ff9e00";

      ctx.beginPath();
      ctx.moveTo(wall.start + transformX, height + transformY);
      ctx.lineTo(wall.end + transformX, height + transformY);
      ctx.stroke();

      let goalCenter = (wall.start + wall.end) / 2;
      ctx.strokeStyle = "#000000";
      ctx.shadowColor = "#000000";
      ctx.beginPath();
      ctx.moveTo(goalCenter - 75 + transformX, transformY);
      ctx.lineTo(goalCenter + 75 + transformX, transformY);
      ctx.stroke();
    });
  }
}());
