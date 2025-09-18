# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START aiplatform_predict_custom_trained_model_sample]
from typing import Dict, List, Union

from google.cloud import aiplatform


def predict_custom_trained_model_sample(
    project: str,
    endpoint_id: str,
    instances: Union[Dict, List[Dict]],
    location: str = "us-central1",
    api_endpoint: str = None,
):
    """
    `instances` can be either single instance of type dict or a list
    of instances.
    """
    # Initialize aiplatform with project and location
    aiplatform.init(project=project, location=location)
    
    # Get the endpoint using the high-level Vertex AI SDK
    endpoint = aiplatform.Endpoint(endpoint_name=endpoint_id)
    
    # Make prediction using the high-level SDK which handles SSL properly
    response = endpoint.predict(instances=instances)
    
    print("response")
    print(" predictions:", response.predictions)
    for i, prediction in enumerate(response.predictions):
        print(f" prediction {i}:", prediction)


# [END aiplatform_predict_custom_trained_model_sample]
if __name__ == "__main__":
    predict_custom_trained_model_sample(
        project="1055179264064",
        endpoint_id="703857866078945280",
        location="us-central1",
        instances=[
            {"prompt": "Apa sentimen dari kalimat berikut ini?\nKalimat: Buku ini sangat membosankan.\nJawaban: "}
        ]
    )
