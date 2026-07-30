import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookmarkPlus,
  BookOpenCheck,
  Clock3,
  Folder,
  FolderPlus,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { dictionaryApi } from '../services/api';

const EMPTY_OVERVIEW = {
  stats: { totalSearches: 0, uniqueWords: 0, savedWords: 0, projects: 0 },
  projects: [],
  recentSearches: [],
  topWords: [],
};

function SignInState({ onRequireAuth }) {
  return (
    <div className="dictionary-signin">
      <span><Languages size={25} /></span>
      <h3>Your private learning dictionary</h3>
      <p>Sign in to translate words, organise them into projects, and keep a personal search dashboard.</p>
      <button type="button" onClick={onRequireAuth}><LogIn size={16} /> Sign in to continue</button>
    </div>
  );
}

function ProjectCreator({ value, busy, onChange, onSubmit, onCancel }) {
  return (
    <form className="dictionary-project-creator" onSubmit={onSubmit}>
      <div>
        <span>New dictionary project</span>
        <p>Create a folder such as Movie vocabulary, Job interview, or Warrior words.</p>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Project name"
        maxLength="60"
      />
      <div>
        <button type="button" className="dictionary-secondary-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="dictionary-primary-button" disabled={busy || value.trim().length < 2}>
          {busy ? <LoaderCircle className="spin" size={15} /> : <FolderPlus size={15} />}
          Create
        </button>
      </div>
    </form>
  );
}

function DictionaryDashboard({ overview }) {
  const statItems = [
    ['Total searches', overview.stats.totalSearches],
    ['Unique words', overview.stats.uniqueWords],
    ['Saved words', overview.stats.savedWords],
    ['Projects', overview.stats.projects],
  ];

  return (
    <div className="dictionary-dashboard">
      <div className="dictionary-stat-grid">
        {statItems.map(([label, value]) => (
          <article key={label}><strong>{value}</strong><span>{label}</span></article>
        ))}
      </div>

      <div className="dictionary-dashboard-grid">
        <section className="dictionary-data-card">
          <div className="dictionary-card-heading">
            <div><LayoutDashboard size={16} /><strong>Most searched</strong></div>
            <small>Search frequency</small>
          </div>
          {overview.topWords.length ? (
            <div className="dictionary-ranking">
              {overview.topWords.map((item, index) => (
                <div key={item.term}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.term}</strong>
                  <small>{item.searches} searches</small>
                </div>
              ))}
            </div>
          ) : <p className="dictionary-empty-copy">Your searched words will appear here.</p>}
        </section>

        <section className="dictionary-data-card">
          <div className="dictionary-card-heading">
            <div><Clock3 size={16} /><strong>Recent searches</strong></div>
            <small>Latest activity</small>
          </div>
          {overview.recentSearches.length ? (
            <div className="dictionary-recent-list">
              {overview.recentSearches.map((item) => (
                <div key={item.id}>
                  <strong>{item.term}</strong>
                  <span>{item.matchedProjects ? `${item.matchedProjects} project match` : 'New lookup'}</span>
                </div>
              ))}
            </div>
          ) : <p className="dictionary-empty-copy">No searches yet.</p>}
        </section>
      </div>
    </div>
  );
}

export default function DictionaryPanel({ user, onRequireAuth }) {
  const [section, setSection] = useState('lookup');
  const [query, setQuery] = useState('');
  const [entry, setEntry] = useState(null);
  const [existingMatches, setExistingMatches] = useState([]);
  const [relatedSaved, setRelatedSaved] = useState([]);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [projectWords, setProjectWords] = useState([]);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activityVersion, setActivityVersion] = useState(0);
  const suggestionRequestRef = useRef(0);
  const lookupRequestRef = useRef(0);
  const lastLookedUpRef = useRef('');
  const lastPointerActivityRef = useRef(0);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    setOverviewLoading(true);
    try {
      const data = await dictionaryApi.getOverview();
      setOverview(data);
      setSelectedProjectId((current) => (
        data.projects.some((project) => project.id === current)
          ? current
          : data.projects[0]?.id || ''
      ));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setOverviewLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadOverview();
    else {
      setEntry(null);
      setOverview(EMPTY_OVERVIEW);
      setActiveProject(null);
      setProjectWords([]);
    }
  }, [loadOverview, user]);

  const performLookup = useCallback(async (termValue) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const term = termValue.trim();
    if (!term) return;
    const requestId = lookupRequestRef.current + 1;
    lookupRequestRef.current = requestId;
    lastLookedUpRef.current = term.toLocaleLowerCase();
    setLoading(true);
    setError('');
    setNotice('');
    setSuggestionsOpen(false);
    try {
      const data = await dictionaryApi.lookup(term);
      if (lookupRequestRef.current !== requestId) return;
      setEntry(data.entry);
      setExistingMatches(data.existingMatches || []);
      setRelatedSaved(data.relatedSaved || []);
      await loadOverview();
    } catch (requestError) {
      if (lookupRequestRef.current !== requestId) return;
      setError(requestError.message);
    } finally {
      if (lookupRequestRef.current === requestId) setLoading(false);
    }
  }, [loadOverview, onRequireAuth, user]);

  const searchWord = (event) => {
    event.preventDefault();
    performLookup(query);
  };

  useEffect(() => {
    const term = query.trim();
    if (!user || section !== 'lookup' || !term) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsOpen(false);
      return undefined;
    }

    setSuggestionsOpen(true);
    const suggestionTimer = window.setTimeout(async () => {
      const requestId = suggestionRequestRef.current + 1;
      suggestionRequestRef.current = requestId;
      setSuggestionsLoading(true);
      try {
        const data = await dictionaryApi.getSuggestions(term);
        if (suggestionRequestRef.current === requestId) {
          setSuggestions(data.suggestions || []);
        }
      } catch {
        if (suggestionRequestRef.current === requestId) setSuggestions([]);
      } finally {
        if (suggestionRequestRef.current === requestId) setSuggestionsLoading(false);
      }
    }, 250);

    const autoSearchTimer = window.setTimeout(() => {
      if (lastLookedUpRef.current !== term.toLocaleLowerCase()) performLookup(term);
    }, 2000);

    return () => {
      window.clearTimeout(suggestionTimer);
      window.clearTimeout(autoSearchTimer);
    };
  }, [activityVersion, performLookup, query, section, user]);

  const registerPointerActivity = () => {
    const now = Date.now();
    if (now - lastPointerActivityRef.current < 400) return;
    lastPointerActivityRef.current = now;
    setActivityVersion((current) => current + 1);
  };

  const chooseSuggestion = (suggestion) => {
    setQuery(suggestion.term);
    setSuggestionsOpen(false);
    performLookup(suggestion.term);
  };

  const saveEntry = async (projectId = selectedProjectId) => {
    if (!entry || !projectId || saving) return;
    setSaving(true);
    setError('');
    try {
      const data = await dictionaryApi.saveWord(projectId, entry);
      setNotice(`“${entry.term}” saved in ${data.word.projectName}.`);
      setExistingMatches((current) => {
        const withoutProject = current.filter((item) => item.projectId !== data.word.projectId);
        return [data.word, ...withoutProject];
      });
      await loadOverview();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    if (!user) return onRequireAuth();
    if (projectName.trim().length < 2 || saving) return;
    setSaving(true);
    setError('');
    try {
      const data = await dictionaryApi.createProject(projectName.trim());
      setProjectName('');
      setCreatingProject(false);
      setSelectedProjectId(data.project.id);
      if (entry) {
        const saved = await dictionaryApi.saveWord(data.project.id, entry);
        setExistingMatches((current) => [saved.word, ...current]);
        setNotice(`Project created and “${entry.term}” saved in ${data.project.name}.`);
      } else {
        setNotice(`${data.project.name} project created.`);
      }
      await loadOverview();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const openProject = async (project) => {
    setSection('projects');
    setActiveProject(project);
    setLoading(true);
    setError('');
    try {
      const data = await dictionaryApi.getProjectWords(project.id);
      setProjectWords(data.words || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteWord = async (wordId) => {
    const word = projectWords.find((item) => item.id === wordId);
    if (!window.confirm(`Remove “${word?.term || 'this word'}” from ${activeProject?.name || 'this project'}?`)) return;
    try {
      await dictionaryApi.deleteWord(wordId);
      setProjectWords((current) => current.filter((item) => item.id !== wordId));
      await loadOverview();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const projectById = useMemo(
    () => new Map(overview.projects.map((project) => [project.id, project])),
    [overview.projects],
  );

  return (
    <div className="dictionary-view view-enter">
      <div className="dictionary-header">
        <div>
          <span className="section-kicker">Personal word library</span>
          <h2>English to Urdu dictionary</h2>
          <p>Understand words in Urdu and Roman Urdu, then organise useful vocabulary into private projects.</p>
        </div>
        {user && <span className="dictionary-owner"><i /> {user.name}&apos;s private dictionary</span>}
      </div>

      <nav className="dictionary-subnav" aria-label="Dictionary sections">
        {[
          ['lookup', BookOpenCheck, 'Dictionary'],
          ['projects', Folder, 'Projects'],
          ['dashboard', LayoutDashboard, 'Dashboard'],
        ].map(([id, Icon, label]) => (
          <button
            type="button"
            key={id}
            className={section === id ? 'active' : ''}
            onClick={() => { setSection(id); setActiveProject(null); }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      {!user ? <SignInState onRequireAuth={onRequireAuth} /> : (
        <>
          {(error || notice) && (
            <div className={`dictionary-feedback ${error ? 'error' : 'success'}`}>
              {error || notice}
            </div>
          )}

          {section === 'lookup' && (
            <div className="dictionary-lookup-layout">
              <section>
                <div
                  className="dictionary-search-shell"
                  onPointerMove={registerPointerActivity}
                  onKeyDown={() => setActivityVersion((current) => current + 1)}
                >
                  <form className="dictionary-search" onSubmit={searchWord}>
                    <Search size={20} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onFocus={() => query.trim() && setSuggestionsOpen(true)}
                      onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 180)}
                      placeholder="Type an English word, phrase, movie title..."
                      aria-label="Search English to Urdu dictionary"
                      aria-autocomplete="list"
                      aria-expanded={suggestionsOpen}
                      maxLength="80"
                    />
                    <button type="submit" disabled={loading || !query.trim()}>
                      {loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}
                      Search now
                    </button>
                  </form>

                  {suggestionsOpen && query.trim() && (
                    <div className="dictionary-suggestion-menu" role="listbox">
                      <button
                        type="button"
                        className="dictionary-current-query"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => performLookup(query)}
                      >
                        <span><Search size={14} /></span>
                        <div>
                          <strong>{query.trim()}</strong>
                          <small>Full meaning will open automatically after 2 seconds</small>
                        </div>
                      </button>

                      {suggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={`${suggestion.term}-${suggestion.projectId || suggestion.source}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseSuggestion(suggestion)}
                          role="option"
                        >
                          <span className="dictionary-suggestion-word">
                            <strong>{suggestion.term}</strong>
                            <small>{suggestion.partOfSpeech || 'word'}</small>
                          </span>
                          <span className="dictionary-suggestion-meaning">
                            <strong dir="rtl" lang="ur">{suggestion.urdu}</strong>
                            <small>{suggestion.romanUrdu}</small>
                            {suggestion.projectName && <i><Folder size={11} /> {suggestion.projectName}</i>}
                          </span>
                        </button>
                      ))}

                      {suggestionsLoading && (
                        <div className="dictionary-suggestion-loading">
                          <LoaderCircle className="spin" size={14} /> Finding matching words…
                        </div>
                      )}
                      {!suggestionsLoading && suggestions.length === 0 && (
                        <div className="dictionary-suggestion-loading">
                          Keep typing or pause for the complete meaning.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!entry && !loading && (
                  <div className="dictionary-welcome-card">
                    <Languages size={25} />
                    <h3>Search any English word or phrase</h3>
                    <p>You will get Urdu script, Roman Urdu, pronunciation, an English definition, and an example.</p>
                  </div>
                )}

                {entry && (
                  <article className="dictionary-result-card">
                    <div className="dictionary-result-top">
                      <div>
                        <span>{entry.partOfSpeech || 'dictionary entry'}</span>
                        <h3>{entry.term}</h3>
                        {entry.pronunciation && <small>/{entry.pronunciation}/</small>}
                      </div>
                      <div className="dictionary-urdu-block">
                        <strong dir="rtl" lang="ur">{entry.urdu}</strong>
                        <span>{entry.romanUrdu}</span>
                      </div>
                    </div>
                    <div className="dictionary-definition">
                      <span>Meaning</span>
                      <p>{entry.definition}</p>
                    </div>
                    {entry.example && (
                      <div className="dictionary-example">
                        <span>Example</span>
                        <p>{entry.example}</p>
                      </div>
                    )}
                    {entry.synonyms?.length > 0 && (
                      <div className="dictionary-synonyms">
                        <span>Matching words</span>
                        <div>{entry.synonyms.map((word) => <button type="button" key={word} onClick={() => setQuery(word)}>{word}</button>)}</div>
                      </div>
                    )}
                  </article>
                )}

                {existingMatches.length > 0 && (
                  <div className="dictionary-match-card">
                    <span>Already saved in</span>
                    <div>
                      {existingMatches.map((match) => (
                        <button
                          type="button"
                          key={`${match.projectId}-${match.id}`}
                          onClick={() => openProject(projectById.get(String(match.projectId)) || {
                            id: match.projectId,
                            name: match.projectName,
                          })}
                        >
                          <Folder size={14} /> {match.projectName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {relatedSaved.length > 0 && (
                  <div className="dictionary-match-card subtle">
                    <span>Related words in your projects</span>
                    <div>
                      {relatedSaved.map((match) => (
                        <button type="button" key={match.id} onClick={() => setQuery(match.term)}>
                          {match.term} · {match.projectName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <aside className="dictionary-save-panel">
                <div className="dictionary-card-heading">
                  <div><BookmarkPlus size={16} /><strong>Save this word</strong></div>
                </div>
                <p>Keep this entry in a private project so you can find and practise it later.</p>
                {overview.projects.length ? (
                  <>
                    <label>
                      Project
                      <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                        {overview.projects.map((project) => (
                          <option value={project.id} key={project.id}>{project.name} ({project.wordCount})</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="dictionary-primary-button full"
                      disabled={!entry || saving}
                      onClick={() => saveEntry()}
                    >
                      {saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}
                      Add to project
                    </button>
                  </>
                ) : (
                  <p className="dictionary-empty-copy">Create your first project to start saving vocabulary.</p>
                )}
                <button type="button" className="dictionary-new-project" onClick={() => setCreatingProject(true)}>
                  <FolderPlus size={15} /> New project
                </button>
                {creatingProject && (
                  <ProjectCreator
                    value={projectName}
                    busy={saving}
                    onChange={setProjectName}
                    onSubmit={createProject}
                    onCancel={() => setCreatingProject(false)}
                  />
                )}
              </aside>
            </div>
          )}

          {section === 'projects' && (
            <div className="dictionary-projects-section">
              {activeProject ? (
                <>
                  <button type="button" className="dictionary-back-button" onClick={() => setActiveProject(null)}>
                    <ArrowLeft size={15} /> All projects
                  </button>
                  <div className="dictionary-project-title">
                    <div><span><Folder size={19} /></span><div><small>Dictionary project</small><h3>{activeProject.name}</h3></div></div>
                    <strong>{projectWords.length} words</strong>
                  </div>
                  {loading ? (
                    <div className="dictionary-loading"><LoaderCircle className="spin" /> Loading words…</div>
                  ) : projectWords.length ? (
                    <div className="dictionary-word-grid">
                      {projectWords.map((word) => (
                        <article key={word.id}>
                          <button type="button" className="dictionary-delete-word" onClick={() => deleteWord(word.id)} aria-label={`Remove ${word.term}`}>
                            <Trash2 size={14} />
                          </button>
                          <span>{word.partOfSpeech || 'word'}</span>
                          <h4>{word.term}</h4>
                          <strong dir="rtl" lang="ur">{word.urdu}</strong>
                          <p>{word.romanUrdu}</p>
                          <small>{word.searchCount} searches</small>
                        </article>
                      ))}
                    </div>
                  ) : <p className="dictionary-empty-copy">No words saved in this project yet.</p>}
                </>
              ) : (
                <>
                  <div className="dictionary-section-heading">
                    <div><h3>Your projects</h3><p>Folders keep vocabulary grouped by movie, course, job, or any topic.</p></div>
                    <button type="button" className="dictionary-primary-button" onClick={() => setCreatingProject(true)}>
                      <FolderPlus size={15} /> New project
                    </button>
                  </div>
                  {creatingProject && (
                    <ProjectCreator
                      value={projectName}
                      busy={saving}
                      onChange={setProjectName}
                      onSubmit={createProject}
                      onCancel={() => setCreatingProject(false)}
                    />
                  )}
                  {overviewLoading ? (
                    <div className="dictionary-loading"><LoaderCircle className="spin" /> Loading projects…</div>
                  ) : overview.projects.length ? (
                    <div className="dictionary-project-grid">
                      {overview.projects.map((project) => (
                        <button type="button" key={project.id} onClick={() => openProject(project)}>
                          <span><Folder size={19} /></span>
                          <div>
                            <strong>{project.name}</strong>
                            <small>{project.wordCount} words · {project.totalWordSearches} saved-word searches</small>
                            {project.preview?.length > 0 && <p>{project.preview.join(' · ')}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : <p className="dictionary-empty-copy">No projects yet. Create one for your first vocabulary collection.</p>}
                </>
              )}
            </div>
          )}

          {section === 'dashboard' && <DictionaryDashboard overview={overview} />}
        </>
      )}
    </div>
  );
}
