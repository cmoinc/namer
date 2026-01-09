"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from "react";
import JSZip from "jszip";

interface FileItem {
  original: File;
  newBaseName: string;
  extension: string;
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot) : "";
}

function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
}

export default function Home() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth);
  const [isDragOver, setIsDragOver] = useState(false);

  const prefix = `${year}_${month}_`;

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const handleFiles = useCallback((newFiles: FileList) => {
    const fileItems: FileItem[] = Array.from(newFiles).map((file) => ({
      original: file,
      newBaseName: getBaseName(file.name),
      extension: getExtension(file.name),
    }));
    setFiles((prev) => [...prev, ...fileItems]);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const updateFileName = useCallback((index: number, newName: string) => {
    setFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, newBaseName: newName } : file
      )
    );
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const downloadFiles = useCallback(async () => {
    if (files.length === 0) return;

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (files.length === 1) {
      const file = files[0];
      const newName = prefix + file.newBaseName + file.extension;
      downloadBlob(file.original, newName);
    } else {
      const zip = new JSZip();
      for (const file of files) {
        const newName = prefix + file.newBaseName + file.extension;
        zip.file(newName, file.original);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `namer_${prefix}files.zip`);
    }
  }, [files, prefix]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-center text-4xl font-bold mb-2">
          namer
        </h1>
        <p className="text-white/80 text-center mb-8">
          ファイル名を YYYY_MM_ 形式で一括変換
        </p>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Drop Zone */}
          <div
            onClick={() => document.getElementById("fileInput")?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-5 ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50"
            }`}
          >
            <div className="text-5xl mb-3">📁</div>
            <div className="text-gray-600 text-lg">
              ファイルをドラッグ＆ドロップ
            </div>
            <div className="text-gray-400 text-sm mt-2">
              またはクリックしてファイルを選択
            </div>
          </div>
          <input
            type="file"
            id="fileInput"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Date Selector */}
          <div className="flex gap-3 items-center mb-5 p-4 bg-gray-50 rounded-lg">
            <label className="font-semibold text-gray-700">
              日付プレフィックス:
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="text-gray-900">年</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {parseInt(m)}
                </option>
              ))}
            </select>
            <span className="text-gray-900">月</span>
          </div>

          {/* File List */}
          <div className="mt-5">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                ファイルが選択されていません
              </div>
            ) : (
              files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-3"
                >
                  <div className="text-2xl">📄</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      元のファイル名: {file.original.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-indigo-600 font-bold">
                        {prefix}
                      </span>
                      <input
                        type="text"
                        value={file.newBaseName}
                        onChange={(e) => updateFileName(index, e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-indigo-400 rounded-md bg-indigo-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 focus:bg-white"
                        placeholder="新しいファイル名"
                      />
                      <span className="text-gray-500">{file.extension}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:scale-125 transition-transform text-xl px-2"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 justify-center">
            {files.length > 0 && (
              <button
                onClick={clearFiles}
                className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                クリア
              </button>
            )}
            <button
              onClick={downloadFiles}
              disabled={files.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              ダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
