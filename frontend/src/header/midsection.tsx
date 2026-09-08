function App() {
  return (
    <div className="flex w-full max-w-xl items-center justify-center px-4">
      <input
        type="text"
        placeholder="Search..."
        className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:ring-blue-500/30"
      />
    </div>
  );
}

export default App;
