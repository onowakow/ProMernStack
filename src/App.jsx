const { useState, useEffect } = React;

const dateRegex = new RegExp('^\\d\\d\\d\\d-\\d\\d-\\d\\d');

// Note: book refers to createIssue. I call it handleAddIssue

const jsonDateReviver = (key, value) => {
  if (dateRegex.test(value)) return new Date(value);
  return value;
}

const IssueFilter = () => {
  return <p>This is a placeholder for IssueFilter</p>;
};

const IssueTable = ({ issues }) => {
  const issueRows = issues.map((issue) => (
    <IssueRow key={issue.id} issue={issue} />
  ));

  return (
    <table className="table-bordered">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Created</th>
          <th>Effort</th>
          <th>Due Date</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody>{issueRows}</tbody>
    </table>
  );
};

const IssueAdd = ({ handleAddIssue }) => {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleOwnerChange = (event) => {
    setOwner(event.target.value);
  };
  
  const handleSubmit = (event) => {
    event.preventDefault()

    const issue = {
      title: title,
      owner: owner,
      due: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 10)
    }

    // pass to parent
    handleAddIssue(issue)
    
    // clear input
    setTitle('')
    setOwner('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Owner"
        value={owner}
        onChange={handleOwnerChange}
      />

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={handleTitleChange}
      />

      <button type='submit'>Add</button>

    </form>
  );
};

const graphQLFetch = async (query, variables ={}) => {
  try {
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ query, variables })
    })

    const body = await response.text()
    const result = JSON.parse(body, jsonDateReviver)

    if (result.errors) {
      const error = result.errors[0]
      if (error.extensions.code == 'BAD_USER_INPUT') {
        const details = error.extensions.exception.errors.join('/n')
        alert(`${error.message}:\n ${details}`)
      } else {
        alert(`${error.extensions.code}: ${error.message}`)
      }
    }
    return result.data

  } catch(e) {
    alert(`Error in sending data to server: ${e.message}`)
  }
} 

const IssueRow = ({ issue }) => {
  return (
    <tr>
      <td>{issue.id}</td>
      <td>{issue.status}</td>
      <td>{issue.owner}</td>
      <td>{issue.created.toDateString()}</td>
      <td>{issue.effort}</td>
      <td>{issue.due ? issue.due.toDateString() : ""}</td>
      <td>{issue.title}</td>
    </tr>
  );
};

const IssueList = () => {
  const [issues, setIssues] = useState([]);
  
  // REVISIT
  const loadData = async () => {
    const query = `query{
      issueList {
        id title status owner created effort due
      }
    }`;

    const data = await graphQLFetch(query)
    if (data) {
      setIssues(data.issueList)
    }
  }
  // REVISIT

  useEffect(() => {
    loadData()
  }, [])

  const handleAddIssue = async (issue) => {
    const query = `mutation issueAdd($issue: IssueInputs!){
      issueAdd(issue: $issue) {
        id
      }
    }`

    const data = await graphQLFetch(query, { issue });
    if (data) {
      loadData()
    }

  };

  return (
    <>
      <h1>Issue Tracker</h1>
      <IssueFilter />
      <hr />
      <IssueTable issues={issues} />
      <hr />
      <IssueAdd handleAddIssue={handleAddIssue} />
    </>
  );
};

const element = <IssueList />;

ReactDOM.render(element, document.getElementById("contents"));
