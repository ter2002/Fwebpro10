const express = require("express");
const pool = require("../config");
const multer = require("multer");
const path = require("path");

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./static/uploads");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

const router = express.Router();
// Get comment
router.get("/:blogId/comments", function (req, res, next) {});

// Create new comment
router.post(
  "/:blogId/comments",
  upload.single("myImage"),
  async function (req, res, next) {
    const file = req.file;
    const { blogId } = req.params;
    const { comment, like } = req.body;
    const [rows, fields] = await pool.query(
      `INSERT INTO comments VALUES (0, ?, ?, 0, CURRENT_TIMESTAMP, null)`,
      [blogId, comment]
    );
    if (file) {
      await pool.query(
        `INSERT INTO images (blog_id, comment_id, file_path, update_by_id, main) VALUES (?, ?, ?, null, ?)`,
        [blogId, rows.insertId, file.path.substring(6), 1]
      );
    }
    res.redirect("/blogs/${blogId}");
  }
);

// Update comment
router.put("/comments/:commentId", async function (req, res, next) {
  const { commentId } = req.params;
  const { comment, like, comment_date, comment_by_id, blog_id } = req.body;
  await pool.query(
    `
        UPDATE comments
        SET
        comments.comment = ?,
        comments.like = ?,
        comments.comment_date = ?,
        comments.comment_by_id = ?,
        comments.blog_id = ?
        WHERE comments.id = ?;
        `,
    [comment, like, comment_date, comment_by_id, blog_id, commentId]
  );
  const [rows, fields] = await pool.query(
    `SELECT comment, comments.like, comment_date, comment_by_id, blog_id FROM comments WHERE comments.id  = ?`,
    [commentId]
  );
  res.json({
    message: `Comment ID ${commentId} is updated.`,
    comment: rows[0],
  });
});

router.delete("/comments/:commentId", async function (req, res, next) {
  const { commentId } = req.params;
  const [rows, fields] = await pool.query(
    `SELECT * FROM comments WHERE comments.id  = ?`,
    [commentId]
  );
  //   console.log("🚀 ~ file: comment.js ~ line 77 ~ rows", rows.blog_id)
  await pool.query(
    `
        DELETE FROM comments WHERE comments.id = ?;
        `,
    [commentId]
  );
  const [rows2, fields2] = await pool.query(
    `SELECT * FROM comments WHERE blog_id  = ?`,
    [rows[0].blog_id]
  );
  console.log("🚀 ~ file: comment.js ~ line 88 ~ rows2", rows2);
  res.json({
    message: `Comment ID ${commentId} is deleted.`,
  });
});

// Delete comment
router.put("/comments/addlike/:commentId", async function (req, res, next) {
  const { commentId } = req.params;

  //   let likeNum = rows[0].like;
  //   likeNum += 1;

  //Update จำนวน Like กลับเข้าไปใน DB
  await pool.query(
    `UPDATE comments SET comments.like=(comments.like+1) WHERE comments.id=?`,
    [commentId]
  );
  const [rows, fields] = await pool.query(
    `SELECT * FROM comments WHERE comments.id  = ?`,
    [commentId]
  );

  res.json({
    blogId: rows[0].blog_id,
    commentId: commentId,
    likeNum: rows[0].like,
  });
});

exports.router = router;
