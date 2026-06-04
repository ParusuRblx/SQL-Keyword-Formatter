// ============================================================
// SQLキーワード一覧
// ============================================================
const SQL_KEYWORDS = [
  // DML
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES",
  "UPDATE", "SET", "DELETE", "RETURNING",
  // DDL
  "CREATE", "TABLE", "DROP", "ALTER", "ADD", "COLUMN",
  "INDEX", "VIEW", "DATABASE", "SCHEMA", "TRUNCATE",
  "RENAME", "MODIFY",
  // JOIN
  "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER",
  "CROSS", "NATURAL", "LATERAL", "ON", "USING",
  // 条件・論理演算子
  "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN",
  "LIKE", "ILIKE", "IS", "NULL", "ANY", "ALL", "SOME",
  // CASE
  "CASE", "WHEN", "THEN", "ELSE", "END", "IF",
  // 並び替え・集計
  "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET",
  "FETCH", "FIRST", "ROWS", "ONLY",
  // その他SELECT句
  "DISTINCT", "AS", "WITH", "UNION", "INTERSECT", "EXCEPT",
  // 制約
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE",
  "CHECK", "DEFAULT", "CONSTRAINT", "NOT NULL",
  "AUTO_INCREMENT", "IDENTITY", "SERIAL",
  // トランザクション
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "SAVEPOINT",
  // 権限
  "GRANT", "REVOKE", "PRIVILEGES", "TO", "PUBLIC", "ROLE",
  // 管理
  "EXPLAIN", "ANALYZE", "VACUUM", "REINDEX",
  // 集計・スカラー関数
  "COUNT", "SUM", "AVG", "MIN", "MAX",
  "COALESCE", "NULLIF", "CAST", "CONVERT",
  "CONCAT", "SUBSTRING", "TRIM", "UPPER", "LOWER",
  "LENGTH", "REPLACE", "NOW", "DATE",
  // ソート
  "ASC", "DESC",
  // ウィンドウ関数
  "OVER", "PARTITION", "ROW_NUMBER", "RANK", "DENSE_RANK",
  "LAG", "LEAD", "NTILE", "PERCENT_RANK", "CUME_DIST",
  // MERGE
  "MERGE", "MATCHED", "TARGET", "SOURCE",
  "APPLY", "PIVOT", "UNPIVOT",
  // ストアドプロシージャ・トリガー
  "DECLARE", "PROCEDURE", "FUNCTION", "TRIGGER",
  "AFTER", "BEFORE", "INSTEAD", "EACH", "FOR",
  "EXECUTE", "CALL", "RETURN", "RETURNS",
  "LANGUAGE", "PLPGSQL",
  // データ型
  "INT", "INTEGER", "BIGINT", "SMALLINT", "TINYINT",
  "FLOAT", "DOUBLE", "DECIMAL", "NUMERIC",
  "CHAR", "VARCHAR", "TEXT", "BLOB", "CLOB",
  "BOOLEAN", "BOOL", "TIMESTAMP", "DATETIME", "YEAR", "INTERVAL",
  // 定数
  "TRUE", "FALSE", "UNKNOWN",
  "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP",
  // その他
  "TOP", "ROWNUM",
];

// ============================================================
// 正規表現の構築
// 長いキーワードを先にマッチさせるため長さ降順にソート
// ============================================================
const sortedKeywords = [...new Set(SQL_KEYWORDS)]
  .sort((a, b) => b.length - a.length);

const KEYWORD_PATTERN = new RegExp(
  `\\b(${sortedKeywords.map(k => k.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "gi"
);

// ============================================================
// フォーマット処理
// ============================================================

/**
 * テキスト内のSQLキーワードを大文字に変換する
 * @param {string} text - 入力テキスト
 * @returns {{ plain: string, html: string, count: number }}
 */
function formatSQL(text) {
  if (!text.trim()) return { plain: "", html: "", count: 0 };

  let count = 0;

  // プレーンテキスト（コピー用）
  const plain = text.replace(KEYWORD_PATTERN, (match) => {
    count++;
    return match.toUpperCase();
  });

  // HTML（表示用）: エスケープしてからキーワードをspanで囲む
  const escaped = plain
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = escaped.replace(
    new RegExp(`\\b(${sortedKeywords.join("|")})\\b`, "gi"),
    (match) => `<span class="kw">${match}</span>`
  );

  return { plain, html, count };
}

// ============================================================
// DOM 操作
// ============================================================
const inputArea  = document.getElementById("inputArea");
const outputArea = document.getElementById("outputArea");
const kwBadge    = document.getElementById("kwCount");
const statKw     = document.getElementById("statKw");
const statChar   = document.getElementById("statChar");
const statLine   = document.getElementById("statLine");
const toast      = document.getElementById("toast");

/** 出力エリアと統計を更新する */
function update() {
  const text = inputArea.value;
  const { html, count } = formatSQL(text);

  outputArea.innerHTML =
    html ||
    `<span style="color:var(--color-muted);opacity:0.5">変換結果がここに表示されます</span>`;

  kwBadge.textContent = `${count} keywords`;
  statKw.textContent   = count;
  statChar.textContent = text.length;
  statLine.textContent = text ? text.split("\n").length : 0;
}

/** 入力をクリアする */
function clearAll() {
  inputArea.value = "";
  update();
}

/** サンプルSQLを挿入する */
function loadSample() {
  inputArea.value = [
    "select u.id, u.name, count(o.id) as order_count",
    "from users u",
    "left join orders o on u.id = o.user_id",
    "where u.created_at >= '2024-01-01'",
    "  and u.status = 'active'",
    "group by u.id, u.name",
    "having count(o.id) > 5",
    "order by order_count desc",
    "limit 20;",
  ].join("\n");
  update();
}

/** 変換済みテキストをクリップボードにコピーする */
function copyOutput() {
  const { plain } = formatSQL(inputArea.value);
  if (!plain) return;

  navigator.clipboard.writeText(plain).then(() => {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  });
}

// ============================================================
// イベントリスナー
// ============================================================
inputArea.addEventListener("input", update);

// ボタンはHTML側のonclick属性から呼び出すため、グローバルに公開
window.clearAll    = clearAll;
window.loadSample  = loadSample;
window.copyOutput  = copyOutput;

// 初期描画
update();
